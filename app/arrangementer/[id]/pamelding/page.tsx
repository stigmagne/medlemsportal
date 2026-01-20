import { createClient } from '@/lib/supabase/server'
import { getEventDetails } from '@/app/actions/events'
import EventRegistrationForm from '@/components/events/EventRegistrationForm'
import { notFound } from 'next/navigation'

export default async function RegistrationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch event
    const event = await getEventDetails(id)
    if (!event) notFound()

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    let memberId
    let pendingDebt = 0
    let unpaidYears: number[] = []
    let forcePayDebt = false
    let membershipFee = 500

    // Full implementation for replace:
    // 1. Fetch event details including flags (already done by `event = await getEventDetails(id)`)
    // 2. Fetch Org Fee
    const { data: org } = await supabase.from('organizations').select('membership_fee').eq('id', event.org_id).single()
    membershipFee = org?.membership_fee || 500

    if (user) {
        const { data: member } = await supabase
            .from('members')
            .select('id, unpaid_years')
            .eq('user_id', user.id)
            .eq('org_id', event.org_id)
            .single()

        if (member) {
            memberId = member.id
            unpaidYears = member.unpaid_years || []
            pendingDebt += unpaidYears.length * membershipFee

            // Check for current year pending invoice
            const typeName = 'membership_fee'
            const { data: currentTx } = await supabase
                .from('payment_transactions')
                .select('amount')
                .eq('member_id', member.id)
                .eq('type', typeName)
                .eq('status', 'pending')
                .gt('created_at', `${new Date().getFullYear()}-01-01`)

            if (currentTx) {
                currentTx.forEach(tx => pendingDebt += Number(tx.amount))
            }

            // CHECK RESTRICTIONS
            if (pendingDebt > 0) {
                // If requires active membership (current year paid) AND current year is pending -> Force
                if (event.requires_active_membership) {
                    // Simplified: if checking active membership, and they have ANY pending debt, force it.
                    // Or specifically current year? Usually "Active" means no debt.
                    forcePayDebt = true
                }
                // If requires prev year payment AND they have unpaid years -> Force
                if (event.requires_prev_year_payment && unpaidYears.length > 0) {
                    forcePayDebt = true
                }
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{event.title}</h1>
                <p className="mt-4 text-lg text-gray-600">
                    📅 {new Date(event.event_date).toLocaleString('nb-NO', { dateStyle: 'long', timeStyle: 'short' })}
                    <span className="mx-2">•</span>
                    📍 {event.location || 'Sted kommer'}
                </p>
            </div>

            <EventRegistrationForm
                event={event}
                memberId={memberId}
                pendingDebt={pendingDebt}
                unpaidYears={unpaidYears}
                membershipFee={membershipFee}
                forcePayDebt={forcePayDebt}
            />
        </div>
    )
}
