import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SubscriptionManager from '@/components/superadmin/SubscriptionManager'

export default async function SuperadminOrganizationDetails({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch org details
    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !org) {
        notFound()
    }

    // Fetch member count
    const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)

    // Fetch available plans
    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name, price')
        .eq('is_active', true)
        .order('price', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/superadmin/dashboard"
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2 inline-block"
                    >
                        ← Tilbake til oversikt
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {org.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Org.nr: {org.org_nr || 'Ikke registrert'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <a
                        href={`/org/${org.slug}/dashboard`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Gå til dashboard
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Nøkkeltall
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Antall medlemmer</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{memberCount || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Opprettet dato</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {new Date(org.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {/* Subscription Management */}
                    <SubscriptionManager
                        orgId={org.id}
                        initialData={{
                            subscription_plan: org.subscription_plan,
                            subscription_status: org.subscription_status,
                            subscription_balance: org.subscription_balance,
                            subscription_year: org.subscription_year,
                            subscription_expiry: org.subscription_expiry
                        }}
                        availablePlans={plans || []}
                    />

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Kontaktinformasjon
                        </h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Kontaktperson</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    -
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">E-post</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    -
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
