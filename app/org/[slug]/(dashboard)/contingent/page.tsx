import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMembershipFees } from './actions'

export default async function ContingentPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: organization } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!organization) redirect('/')

    const org_id = organization.id

    // Fetch active fees
    const fees = await getMembershipFees(org_id)
    const activeFees = fees.filter(f => f.is_active)

    // Fetch members count (for now, we will add full list later)
    const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org_id)

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kontingentoversikt
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Oversikt over medlemskap og betalinger.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/org/${slug}/contingent/settings`}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        ⚙️ Innstillinger
                    </Link>
                </div>
            </div>

            {/* Quick Stats or Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500">Aktive krav</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">-</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500">Innbetalt i år</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">0 kr</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500">Utestående</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">0 kr</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
                {activeFees.length === 0 ? (
                    <div className="py-8">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 inline-block p-4 rounded-full mb-4">
                            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ingen kontingenter definert</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            For å kunne sende ut betalingskrav må du først definere hva det koster å være medlem.
                        </p>
                        <Link
                            href={`/org/${slug}/contingent/settings`}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Opprett kontingent nå
                        </Link>
                    </div>
                ) : (
                    <div className="text-left">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Klar til å sende krav?</h3>
                        <p className="text-gray-500 mb-4">
                            Du har <strong>{activeFees.length}</strong> aktive kontingenttyper og <strong>{count}</strong> medlemmer.
                        </p>
                        <p className="text-sm text-gray-400 italic">
                            (Funksjonalitet for å sende ut masse-krav kommer i neste steg...)
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
