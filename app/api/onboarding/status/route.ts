import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const organizationId = request.nextUrl.searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 })
        }

        const supabase = await createClient()
        // Verify access? Or is this public status? Let's protect it.
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            // Allow checking status if just returning boolean flags? 
            // Better safe: require auth.
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: org } = await supabase
            .from('organizations')
            .select('stripe_account_id')
            .eq('id', organizationId)
            .single()

        if (!org?.stripe_account_id) {
            return NextResponse.json({
                onboardingCompleted: false,
                chargesEnabled: false,
                payoutsEnabled: false
            })
        }

        const account = await stripe.accounts.retrieve(org.stripe_account_id)

        const status = {
            onboardingCompleted: account.details_submitted || false,
            chargesEnabled: account.charges_enabled || false,
            payoutsEnabled: account.payouts_enabled || false,
            requiresAction: !account.charges_enabled || !account.payouts_enabled,
            errors: account.requirements?.errors
        }

        // Update database if status changed significantly? 
        // We can do this here or rely on webhooks. 
        // Syncing here ensures instant feedback on the settings page.
        await supabase
            .from('organizations')
            .update({
                stripe_onboarding_completed: status.onboardingCompleted,
                stripe_charges_enabled: status.chargesEnabled,
                stripe_payouts_enabled: status.payoutsEnabled
            })
            .eq('id', organizationId)

        return NextResponse.json(status)

    } catch (error) {
        console.error('Status check error:', error)
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
    }
}
