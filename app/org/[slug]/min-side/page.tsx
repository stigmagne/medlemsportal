import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import PaymentButton from './PaymentButton'
import MyPageFamilySection from '@/components/minside/MyPageFamilySection'

export default async function MinSidePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const t = await getTranslations('MinSideOrg')
    const supabase = await createClient()

    // Authenticated user is guaranteed by layout
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return null

    // Get organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('id, account_number')
        .eq('slug', slug)
        .single()

    if (!organization) {
        return null // Should be handled by layout
    }

    // Fetch linked member profile for THIS organization
    const { data: member, error: memberError } = await supabase
        .from('members')
        .select(`
            *,
            family:families!family_id(
                id, 
                family_name, 
                payer_member_id,
                payer:members!families_payer_member_id_fkey(first_name, last_name),
                family_members:members!members_family_id_fkey(id, first_name, last_name)
            )
        `)
        .eq('email', user.email)
        .eq('organization_id', organization.id)
        .single()

    console.log("MinSide Debug:", {
        email: user.email,
        orgId: organization.id,
        memberFound: !!member,
        memberData: member,
        memberError: memberError ? JSON.stringify(memberError) : null
    })

    if (!member) {
        return (
            <div className="text-center py-12">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg inline-block max-w-lg">
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">{t('notFound.title')}</h2>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        {t('notFound.description')} <strong>{user.email}</strong>.
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        {t('notFound.contact')}
                    </p>
                </div>
            </div>
        )
    }

    // --- Payment Logic Start ---
    const { data: fees } = await supabase
        .from('membership_fees')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)

    const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('fee_id, status')
        .eq('member_id', member.id)
        .in('status', ['paid', 'captured']) // Include both statuses as paid

    const paidFeeIds = new Set(transactions?.map(t => t.fee_id))
    const outstandingFees = fees?.filter(f => !paidFeeIds.has(f.id)) || []
    // --- Payment Logic End ---

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {t('welcome', { name: member.first_name })}
                </h1>

                {/* Family Section */}
                {member.family && (
                    <MyPageFamilySection
                        family={member.family}
                        currentMemberId={member.id}
                    />
                )}

                {/* Payment Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {t('payments.title')}
                    </h2>
                    {outstandingFees.length > 0 ? (
                        <div className="space-y-4">
                            {outstandingFees.map(fee => (
                                <div key={fee.id} className="border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{fee.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('payments.amount')} <span className="font-medium text-gray-900 dark:text-white">{fee.amount},-</span>
                                            {fee.due_date && ` • ${t('payments.dueDate')} ${fee.due_date}`}
                                        </p>
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <PaymentButton
                                            orgId={organization.id}
                                            feeId={fee.id}
                                            memberId={member.id}
                                            amount={fee.amount}
                                            hasInvoiceOption={!!organization.account_number}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('payments.empty')}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            {t('membership.title')}
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">{t('membership.number')}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{member.member_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">{t('membership.category')}</span>
                                <span className="font-medium text-gray-900 dark:text-white capitalize">{member.membership_category || t('membership.unknown')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">{t('membership.status')}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${member.membership_status === 'active'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                    }`}>
                                    {member.membership_status === 'active' ? t('status.active') : member.membership_status === 'inactive' ? t('status.inactive') : t('status.pending')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">{t('membership.joinedDate')}</span>
                                <span className="text-gray-900 dark:text-white">
                                    {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            {t('actions.title')}
                        </h3>
                        <div className="space-y-3">
                            <Link
                                href={`/org/${slug}/min-side/profil`}
                                className="block w-full text-center px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('actions.editProfile')}
                            </Link>
                            <Link
                                href={`/org/${slug}/min-side/medlemskort`}
                                className="block w-full text-center px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('actions.membershipCard')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
