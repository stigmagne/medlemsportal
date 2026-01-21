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
            eventId
        } = await request.json()

        const amountInOre = Math.round(amount * 100)

        const supabase = await createClient()
        const { data: org } = await supabase
            .from('organizations')
            .select('stripe_account_id, stripe_charges_enabled')
            .eq('id', organizationId)
            .single()

        if (!org?.stripe_account_id || !org.stripe_charges_enabled) {
            return NextResponse.json(
                { error: 'Organization has not completed payment setup' },
                { status: 400 }
            )
        }

        // Calculate fees
        // @ts-ignore - function signature might need update or ignore if types mismatch slightly during dev
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
