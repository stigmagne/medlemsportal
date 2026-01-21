import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { calculateFees } from '@/lib/payments/calculate-fees'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const {
            organizationId,
            amount,  // in NOK (e.g., 100)
            memberId,
            paymentType,
            description,
            eventId,
            paymentMethod = 'stripe' // 'stripe' | 'invoice'
        } = await request.json()

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
