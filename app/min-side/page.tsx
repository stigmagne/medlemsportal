import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function MinSidePortalPage() {
    const t = await getTranslations('MinSide')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return null

    // Fetch all memberships for the user, including organization details
    let activeMemberships: any[] = []
    try {
        const { data: memberships } = await supabase
            .from('members')
            .select(`
                id,
                membership_status,
                organization:organizations (
                    id,
                    name,
                    slug
                )
            `)
            .eq('email', user.email)
            .is('deleted_at', null)

        activeMemberships = memberships || []
    } catch (e) {
        console.error('Error fetching memberships:', e)
        // Fallback to empty list
    }

    // 1. No memberships
    if (activeMemberships.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg inline-block max-w-lg">
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">{t('noMemberships.title')}</h2>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        {t('noMemberships.description')}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        {t('noMemberships.contact')}
                    </p>
                </div>
            </div>
        )
    }

    // 2. Single membership -> Redirect
    if (activeMemberships.length === 1) {
        const membership = activeMemberships[0]
        // @ts-ignore
        const org = Array.isArray(membership.organization) ? membership.organization[0] : membership.organization

        if (org?.slug) {
            redirect(`/org/${org.slug}/min-side`)
        }
    }

    // 3. Multiple memberships -> Show Portal
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('title')}
                </h1>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                    {t('description')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMemberships.map((membership) => {
                    // @ts-ignore
                    const org = Array.isArray(membership.organization) ? membership.organization[0] : membership.organization

                    if (!org?.slug) return null

                    return (
                        <Link
                            key={membership.id}
                            href={`/org/${org.slug}/min-side`}
                            className="block group"
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 dark:border-gray-700 h-full flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {org.name}
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        {t('card.status')} <span className={`font-medium ${membership.membership_status === 'active'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-yellow-600 dark:text-yellow-400'
                                            }`}>
                                            {membership.membership_status === 'active' ? t('card.active') : t('card.inactive')}
                                        </span>
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                                    {t('card.goTo')}
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
