import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, Plus } from 'lucide-react'

export default async function MinSidePortalPage() {
    const t = await getTranslations('MinSide')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return null

    // Check if user owns/admins any organizations
    const { data: ownedOrgs } = await supabase
        .from('user_org_access')
        .select('organization_id, organizations(id, name, slug)')
        .eq('user_id', user.id)
        .in('role', ['org_owner', 'org_admin'])
        .not('organization_id', 'is', null)

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
    }

    // If user has org access but no memberships, redirect to their org
    if (ownedOrgs && ownedOrgs.length > 0 && activeMemberships.length === 0) {
        const org = ownedOrgs[0].organizations as unknown as { slug: string }
        if (org?.slug) {
            redirect(`/org/${org.slug}/dashboard`)
        }
    }

    // 1. No memberships AND no owned orgs - show create org option
    if (activeMemberships.length === 0 && (!ownedOrgs || ownedOrgs.length === 0)) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Velkommen til Din Forening
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Du er ikke medlem av noen organisasjon ennå.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Link
                        href="/ny-organisasjon"
                        className="block p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    Opprett ny organisasjon
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Start din egen forening
                                </p>
                            </div>
                        </div>
                    </Link>

                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    Bli medlem
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Kontakt din forening for invitasjon
                                </p>
                            </div>
                        </div>
                    </div>
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
