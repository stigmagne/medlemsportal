import { createClient } from '@/lib/supabase/server'
import PaymentsView from './PaymentsView'

export default async function PaymentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Hent organisasjon
    const { data: org } = await supabase
        .from('organizations')
        .select('id, subscription_balance')
        .eq('slug', slug)
        .single()

    if (!org) {
        return <div>Organization not found</div>
    }

    // Hent alle betalinger for inneværende år
    const currentYear = new Date().getFullYear()
    const { data: payments } = await supabase
        .from('payment_transactions')
        .select(`
            *,
            member:members(first_name, last_name, email)
        `)
        .eq('org_id', org.id)
        .gte('created_at', `${currentYear}-01-01`)
        .order('created_at', { ascending: false })

    const paymentList = payments || []

    return (
        <PaymentsView
            payments={paymentList}
            orgSlug={slug}
            balance={org.subscription_balance}
        />
    )
}
