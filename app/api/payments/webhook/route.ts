import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')!

        let event: Stripe.Event

        try {
            if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET")
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err) {
            console.error('Webhook signature verification failed:', err)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                await handlePaymentSuccess(paymentIntent)
                break
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                await handlePaymentFailure(paymentIntent)
                break
            }

            case 'account.updated': {
                const account = event.data.object as Stripe.Account
                await handleAccountUpdate(account)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const supabase = await createClient()
    const metadata = paymentIntent.metadata

    console.log('Payment succeeded:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        organization: metadata.organization_id,
        type: metadata.payment_type
    })

    // Update payment record in database logic would go here
    // e.g. update 'payments' table or 'members' status
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    console.error('Payment failed:', {
        id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message
    })
}

async function handleAccountUpdate(account: Stripe.Account) {
    const supabase = await createClient()
    const organizationId = account.metadata?.organization_id

    if (organizationId) {
        await supabase
            .from('organizations')
            .update({
                stripe_charges_enabled: account.charges_enabled,
                stripe_payouts_enabled: account.payouts_enabled,
                stripe_onboarding_completed: account.details_submitted
            })
            .eq('id', organizationId)
    }
}
