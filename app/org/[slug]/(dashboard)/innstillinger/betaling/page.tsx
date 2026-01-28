import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PaymentSettingsClient from './PaymentSettingsClient'

export default async function PaymentSettingsPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ success?: string; refresh?: string }>
}) {
    const { slug } = await params
    const { success, refresh } = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check admin access
    const { data: access } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', (
            await supabase
                .from('organizations')
                .select('id')
                .eq('slug', slug)
                .single()
        ).data?.id)
        .single()

    if (!access || !['org_admin', 'org_owner'].includes(access.role)) {
        return <div className="p-4 text-red-600">Du har ikke tilgang til denne siden.</div>
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('id, name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_completed')
        .eq('slug', slug)
        .single()

    if (!org) return <div>Organisasjon ikke funnet</div>

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Betalingsinnstillinger</h1>
                <p className="text-gray-500">Administrer Stripe-konto og betalingsoppsett</p>
            </div>

            <PaymentSettingsClient
                orgId={org.id}
                orgName={org.name}
                orgSlug={slug}
                hasStripeAccount={!!org.stripe_account_id}
                stripeChargesEnabled={org.stripe_charges_enabled || false}
                stripePayoutsEnabled={org.stripe_payouts_enabled || false}
                stripeOnboardingCompleted={org.stripe_onboarding_completed || false}
                showSuccessMessage={success === 'true'}
                shouldRefreshStatus={refresh === 'true'}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Tilbake til innstillinger</CardTitle>
                    <CardDescription>
                        Gå tilbake til hovedinnstillingene
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <a
                        href={`/org/${slug}/innstillinger`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 border border-gray-200 font-medium"
                    >
                        ← Tilbake
                    </a>
                </CardContent>
            </Card>
        </div>
    )
}
