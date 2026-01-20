import { createClient } from '@/lib/supabase/server'
import SubmitExpenseForm from '@/components/expenses/SubmitExpenseForm'
import { getEvents } from '@/app/actions/events'

export default async function NewExpensePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
    if (!org) return <div>Fant ikke organisasjon</div>

    // Fetch recent events for dropdown
    const events = await getEvents(org.id, 'all')

    return (
        <div className="py-6">
            <div className="mb-6 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold">Ny reiseregning</h1>
            </div>
            <SubmitExpenseForm slug={slug} orgId={org.id} events={events || []} />
        </div>
    )
}
