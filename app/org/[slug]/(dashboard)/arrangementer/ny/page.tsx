import { createClient } from '@/lib/supabase/server'
import CreateEventForm from '@/components/events/CreateEventForm'
import { redirect } from 'next/navigation'

export default async function NewEventPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
    if (!org) redirect('/')

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Opprett nytt arrangement</h1>
            <CreateEventForm slug={slug} orgId={org.id} />
        </div>
    )
}
