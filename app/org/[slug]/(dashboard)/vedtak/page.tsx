import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DecisionsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) return null

    // Fetch all published minutes with decisions
    const { data: minutes } = await supabase
        .from('meeting_minutes')
        .select(`
      id, 
      decisions, 
      approved_at,
      meeting:meetings!inner(id, title, meeting_date, org_id)
    `)
        .eq('meeting.org_id', org.id)
        .eq('status', 'published')
        .not('decisions', 'is', null) // Filter out null decisions
        .order('approved_at', { ascending: false })

    // Flatten decisions
    const allDecisions = minutes?.flatMap((m: any) => {
        return (m.decisions || []).map((d: any) => ({
            ...d,
            meetingTitle: m.meeting.title,
            meetingDate: m.meeting.meeting_date,
            meetingId: m.meeting.id
        }))
    }) || []

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Vedtaksoversikt</h1>
            <p className="text-muted-foreground">Oversikt over alle vedtak fattet i publiserte møteprotokoller.</p>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {allDecisions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Ingen vedtak funnet. Vedtak vises her når protokoller er publisert.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {allDecisions.map((decision: any, i: number) => (
                            <div key={i} className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-medium text-lg text-gray-900 dark:text-white">
                                        {decision.text}
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {new Date(decision.meetingDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Fattet i møte: <Link href={`/org/${slug}/moter/${decision.meetingId}/minutes`} className="text-blue-600 hover:underline">{decision.meetingTitle}</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
