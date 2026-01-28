import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
    // Log webhook receipt for monitoring
    const eventId = request.headers.get('stripe-webhook-id') || 'unknown'

    try {
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not configured')
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
        }

        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        if (!signature) {
            console.error('Missing stripe-signature header')
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
        }

        let event: Stripe.Event

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        console.log(`Processing Stripe webhook: ${event.type} (${event.id})`)

        // Handle the event with proper error handling for each type
        try {
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

                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session
                    await handleCheckoutComplete(session)
                    break
                }

                case 'account.updated': {
                    const account = event.data.object as Stripe.Account
                    await handleAccountUpdate(account)
                    break
                }

                case 'invoice.paid': {
                    const invoice = event.data.object as Stripe.Invoice
                    await handleInvoicePaid(invoice)
                    break
                }

                case 'invoice.payment_failed': {
                    const invoice = event.data.object as Stripe.Invoice
                    await handleInvoiceFailed(invoice)
                    break
                }

                default:
                    // Log unhandled events for monitoring but don't fail
                    console.log(`Unhandled Stripe event type: ${event.type}`)
            }
        } catch (handlerError: any) {
            // Log handler errors but still return 200 to prevent Stripe retries for non-transient errors
            console.error(`Error handling ${event.type}:`, handlerError.message)
            // For critical events, you might want to return 500 to trigger retry
            // For now, we log and acknowledge to prevent retry storms
        }

        return NextResponse.json({ received: true, eventId: event.id })

    } catch (error: any) {
        console.error('Webhook processing error:', error.message)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const supabase = createAdminClient()
    const metadata = paymentIntent.metadata

    console.log('Payment succeeded:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        organization: metadata.organization_id,
        type: metadata.payment_type
    })

    // Update payment record if we have a payment_id in metadata
    if (metadata.payment_id) {
        const { error } = await supabase
            .from('payments')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                stripe_payment_intent_id: paymentIntent.id
            })
            .eq('id', metadata.payment_id)

        if (error) {
            console.error('Failed to update payment record:', error)
        }
    }

    // Update member payment status if relevant
    if (metadata.member_id && metadata.payment_type === 'membership') {
        const { error } = await supabase
            .from('members')
            .update({
                payment_status: 'paid',
                last_payment_date: new Date().toISOString()
            })
            .eq('id', metadata.member_id)

        if (error) {
            console.error('Failed to update member payment status:', error)
        }
    }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const supabase = createAdminClient()
    const metadata = paymentIntent.metadata

    console.error('Payment failed:', {
        id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
        organization: metadata.organization_id
    })

    // Update payment record if exists
    if (metadata.payment_id) {
        await supabase
            .from('payments')
            .update({
                status: 'failed',
                error_message: paymentIntent.last_payment_error?.message || 'Payment failed'
            })
            .eq('id', metadata.payment_id)
    }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const supabase = createAdminClient()
    const metadata = session.metadata || {}

    console.log('Checkout completed:', {
        sessionId: session.id,
        amount: (session.amount_total || 0) / 100,
        metadata
    })

    // Handle booking payments
    if (metadata.booking_id) {
        const { error } = await supabase
            .from('resource_bookings')
            .update({
                payment_status: 'paid',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string
            })
            .eq('id', metadata.booking_id)

        if (error) {
            console.error('Error updating booking payment status:', error)
        }
    }

    // Handle event registration payments
    if (metadata.registration_id) {
        const { error } = await supabase
            .from('event_registrations')
            .update({
                payment_status: 'paid',
                stripe_session_id: session.id
            })
            .eq('id', metadata.registration_id)

        if (error) {
            console.error('Error updating registration payment status:', error)
        }
    }
}

async function handleAccountUpdate(account: Stripe.Account) {
    const supabase = createAdminClient()

    // Try to find organization by stripe_account_id first (more reliable)
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_account_id', account.id)
        .single()

    const organizationId = org?.id || account.metadata?.organization_id

    if (organizationId) {
        const { error } = await supabase
            .from('organizations')
            .update({
                stripe_charges_enabled: account.charges_enabled || false,
                stripe_payouts_enabled: account.payouts_enabled || false,
                stripe_onboarding_completed: account.details_submitted || false
            })
            .eq('id', organizationId)

        if (error) {
            console.error('Failed to update organization Stripe status:', error)
        } else {
            console.log(`Updated Stripe status for org ${organizationId}:`, {
                charges: account.charges_enabled,
                payouts: account.payouts_enabled,
                onboarding: account.details_submitted
            })
        }
    } else {
        console.warn('account.updated event received but no organization found for account:', account.id)
    }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    console.log('Invoice paid:', {
        id: invoice.id,
        amount: (invoice.amount_paid || 0) / 100,
        customer: invoice.customer
    })
    // Handle subscription renewals or invoice payments if needed
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
    console.error('Invoice payment failed:', {
        id: invoice.id,
        amount: (invoice.amount_due || 0) / 100,
        customer: invoice.customer
    })
    // Could trigger notification to org admin
}
