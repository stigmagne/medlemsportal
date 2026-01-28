import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { calculateFees } from '@/lib/payments/calculate-fees'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/helpers'
import { enforceRateLimit, RateLimitStrategy, formatRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        const {
            orgSlug,
            amount,  // in NOK (e.g., 100)
            memberId,
            paymentType,
            description,
            eventId,
            paymentMethod = 'stripe' // 'stripe' | 'invoice'
        } = await request.json()

        // SECURITY: Require org access - derive orgId from slug server-side
        const { orgId: organizationId, user } = await requireOrgAccess(orgSlug, 'org_member')

        // RATE LIMIT: Prevent payment spam - 3 requests per minute per user (H5)
        try {
            await enforceRateLimit(RateLimitStrategy.PAYMENT, user.id)
        } catch (error: any) {
            return NextResponse.json(
                { error: `Rate limit overskredet. Vennligst vent ${error.retryAfter || 60} sekunder.` },
                {
                    status: 429,
                    headers: formatRateLimitHeaders({
                        success: false,
                        limit: error.limit,
                        remaining: 0,
                        reset: error.reset,
                        retryAfter: error.retryAfter
                    })
                }
            )
        }

        // SECURITY: Validate amount (positive, not null, reasonable upper limit)
        if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
            return NextResponse.json(
                { error: 'Ugyldig beløp. Må være mellom 1 og 1 000 000 NOK.' },
                { status: 400 }
            )
        }

        const amountInOre = Math.round(amount * 100)

        const supabase = await createClient()

        // Fetch Org Details
        const { data: org } = await supabase
            .from('organizations')
            .select('stripe_account_id, stripe_charges_enabled, account_number, name')
            .eq('id', organizationId)
            .single()

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // SECURITY (M3): Verify booking ownership if bookingId is provided
        if (eventId) {
            // For event payments, verify the event belongs to the organization
            const { data: event } = await supabase
                .from('events')
                .select('org_id')
                .eq('id', eventId)
                .single()

            if (!event || event.org_id !== organizationId) {
                return NextResponse.json(
                    { error: 'Event ikke funnet eller tilhører ikke foreningen' },
                    { status: 404 }
                )
            }
        }

        // --- INVOICE FLOW ---
        if (paymentMethod === 'invoice') {
            if (!org.account_number) {
                return NextResponse.json(
                    { error: 'Foreningen har ikke registrert kontonummer for faktura.' },
                    { status: 400 }
                )
            }

            // 1. Generate KID
            const { generateKid, generateNumericReference } = await import('@/lib/invoicing/kid')

            // Generate a numeric reference. 
            // In a real system, we might use a sequence or CustomerID + InvoiceID.
            // Here we use a random safe numeric reference for MVP.
            const reference = generateNumericReference()
            const kid = generateKid(reference)

            // 2. Create Transaction Record
            const { data: transaction, error: txError } = await supabase
                .from('payment_transactions')
                .insert({
                    org_id: organizationId,
                    member_id: memberId,
                    amount: amount, // DB stores standard currency units or match schema? Schema: DECIMAL. Usually standard units (NOK). 
                    // Wait, Stripe uses cents. DB schema says DECIMAL. Usually we store 100.00 for 100 NOK.
                    // Let's assume standard units for DB.
                    currency: 'NOK',
                    status: 'pending',
                    type: paymentType || 'other',
                    description: description,
                    payment_method: 'invoice',
                    kid: kid,
                    provider_transaction_id: null
                })
                .select()
                .single()

            if (txError) {
                console.error('DB Error:', txError)
                throw new Error('Kunne ikke opprette faktura-transaksjon')
            }

            return NextResponse.json({
                invoice: {
                    kid: kid,
                    accountNumber: org.account_number,
                    amount: amount,
                    organizationName: org.name,
                    transactionId: transaction.id
                }
            })
        }

        // --- STRIPE FLOW ---
        if (!org?.stripe_account_id || !org.stripe_charges_enabled) {
            return NextResponse.json(
                { error: 'Organization has not completed payment setup' },
                { status: 400 }
            )
        }

        // Calculate fees
        // @ts-ignore
        const fees = await calculateFees(organizationId, amountInOre)

        // Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInOre,
            currency: 'nok',
            application_fee_amount: fees.applicationFee,
            transfer_data: {
                destination: org.stripe_account_id,
            },
            metadata: {
                organization_id: organizationId,
                member_id: memberId || '',
                payment_type: paymentType,
                event_id: eventId || '',
                description: description,
                payment_method: 'stripe'
            },
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            fees: fees
        })

    } catch (error: any) {
        console.error('Payment initiation error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to create payment' },
            { status: 500 }
        )
    }
}
