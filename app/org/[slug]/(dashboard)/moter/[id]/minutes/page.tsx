import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MeetingMinutesEditor from '@/components/meetings/MeetingMinutesEditor'
import { getMinutes } from '@/app/actions/minutes'

export default async function MeetingMinutesPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
    const { slug, id } = await params
    const supabase = await createClient()

    // Verify meeting exists
    const { data: meeting } = await supabase
        .from('meetings')
        .select('id, title, meeting_date')
        .eq('id', id)
        .single()

    if (!meeting) return <div>Møtet finnes ikke</div>

    const minutes = await getMinutes(id, slug)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/org/${slug}/moter/${id}`}
                    className="text-gray-500 hover:text-gray-800"
                >
                    ← Tilbake til møtet
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Protokoll: {meeting.title}</h1>
            </div>

            <MeetingMinutesEditor
                meetingId={id}
                slug={slug}
                initialData={minutes}
            />
        </div>
    )
}
