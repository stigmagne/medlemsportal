import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { organizationId } = await request.json()

        const supabase = await createClient()
        // Verify user has admin access to this org
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: access } = await supabase
            .from('user_org_access')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .in('role', ['org_admin', 'superadmin'])
            .single()

        if (!access) {
            return NextResponse.json({ error: 'Forsøk på handling uten tilgang' }, { status: 403 })
        }

        const { data: org } = await supabase
            .from('organizations')
            .select('stripe_account_id, name, org_number')
            .eq('id', organizationId)
            .single()

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        let accountId = org.stripe_account_id

        // Create Stripe Connect account if doesn't exist
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'NO',
                business_type: 'non_profit',
                business_profile: {
                    name: org.name,
                    mcc: '8398', // Charitable organizations
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    organization_id: organizationId,
                    org_number: org.org_number || '',
                }
            })

            accountId = account.id

            // Save to database
            await supabase
                .from('organizations')
                .update({ stripe_account_id: accountId })
                .eq('id', organizationId)
        }

        // Create onboarding link
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${origin}/org/${organizationId}/innstillinger/betaling?refresh=true`, // Redirect back to settings page on refresh
            return_url: `${origin}/org/${organizationId}/innstillinger/betaling?success=true`, // Redirect back on success
            type: 'account_onboarding',
        })

        return NextResponse.json({
            accountId,
            onboardingUrl: accountLink.url
        })

    } catch (error: any) {
        console.error('Stripe onboarding error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to start onboarding' },
            { status: 500 }
        )
    }
}
