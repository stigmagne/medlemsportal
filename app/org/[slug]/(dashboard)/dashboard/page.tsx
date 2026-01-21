import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MemberGrowthChart from '@/components/analytics/MemberGrowthChart'
import PaymentStatusChart from '@/components/analytics/PaymentStatusChart'
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { getTranslations } from 'next-intl/server'
import SubscriptionStatusCard from '@/components/dashboard/SubscriptionStatusCard'
import { RecentActivity } from '@/components/dashboard/recent-activity'

export default async function OrganizationDashboard({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const t = await getTranslations('Dashboard.overview')
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get organization details by slug
    const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    const org_id = organization.id

    // Verify access
    const { data: userAccess } = await supabase
        .from('user_org_access')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', org_id)

    // User must have access to this specific organization
    if (!userAccess || userAccess.length === 0) {
        redirect('/')
    }

    // Get member count
    const { count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org_id)
        .is('deleted_at', null)

    // Get paid contingent count
    const { count: paidContingent } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org_id)
        .eq('status', 'captured')

    // Get email campaigns count
    const { count: emailCampaigns } = await supabase
        .from('email_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org_id)

    // Get new members this month
    const startOfCurrentMonth = new Date()
    startOfCurrentMonth.setDate(1)
    startOfCurrentMonth.setHours(0, 0, 0, 0)

    const { count: newMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org_id)
        .gte('created_at', startOfCurrentMonth.toISOString())
        .is('deleted_at', null)


    // --- Analytics Data Fetching ---

    // 1. Member Growth Data (Last 6 Months)
    const { data: memberDates } = await supabase
        .from('members')
        .select('created_at')
        .eq('organization_id', org_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

    const growthChartData = []
    // Loop back 5 months + current month = 6 months
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i)
        // End of that month to capture all members created up to that point
        const endOfMonthDate = endOfMonth(d)

        const count = (memberDates || []).filter(m => new Date(m.created_at) <= endOfMonthDate).length

        growthChartData.push({
            date: format(d, 'MMM', { locale: nb }), // e.g. "Jan", "Feb"
            count
        })
    }

    // 2. Payment Status Distribution
    const { data: payments } = await supabase
        .from('payment_transactions')
        .select('status')
        .eq('organization_id', org_id)

    const paymentStats = {
        paid: (payments || []).filter(p => p.status === 'captured').length,
        pending: (payments || []).filter(p => p.status === 'authorized' || p.status === 'initiated').length,
        failed: (payments || []).filter(p => p.status === 'failed' || p.status === 'cancelled').length
    }

    const paymentChartData = [
        { name: 'Betalt', value: paymentStats.paid, color: '#10B981' }, // Green
        { name: 'Venter', value: paymentStats.pending, color: '#F59E0B' }, // Amber
        { name: 'Feilet', value: paymentStats.failed, color: '#EF4444' }, // Red
    ]


    const userDisplayName = user.user_metadata?.full_name || 'Administrator'
    const orgName = organization?.name || 'Forening'

    return (
        <div>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('title', { orgName })}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t('welcome', { name: userDisplayName })}
                        </p>
                    </div>

                    <div className="w-full md:w-80 shrink-0">
                        <SubscriptionStatusCard
                            subscriptionBalance={organization.subscription_balance ?? 990}
                            subscriptionYear={organization.subscription_year ?? new Date().getFullYear()}
                            subscriptionPaidAt={organization.subscription_paid_at}
                        />
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {t('stats.members')}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {totalMembers || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {t('stats.paid')}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {paidContingent || 0} / {totalMembers || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {t('stats.campaigns')}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {emailCampaigns || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {t('stats.newMembers')}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {newMembers || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        {t('charts.growth')}
                    </h2>
                    <MemberGrowthChart data={growthChartData} />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        {t('charts.paymentStatus')}
                    </h2>
                    <PaymentStatusChart data={paymentChartData} />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t('quickActions.title')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href={`/org/${slug}/medlemmer/ny`}
                        className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t('quickActions.addMember.title')}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('quickActions.addMember.description')}
                            </p>
                        </div>
                    </Link>

                    <Link
                        href={`/org/${slug}/kommunikasjon/ny`}
                        className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t('quickActions.sendNewsletter.title')}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('quickActions.sendNewsletter.description')}
                            </p>
                        </div>
                    </Link>

                    <Link
                        href={`/org/${slug}/contingent`}
                        className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t('quickActions.viewContingent.title')}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('quickActions.viewContingent.description')}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity orgSlug={slug} orgId={org_id} />
        </div>
    )
}
