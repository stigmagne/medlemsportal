import { getMeetings } from './actions'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export default async function MeetingsPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const meetings = await getMeetings(slug)

    // Separate upcoming and past
    const now = new Date()
    const upcoming = meetings.filter(m => new Date(m.meeting_date) >= now)
    const past = meetings.filter(m => new Date(m.meeting_date) < now).reverse()

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Møter</h1>
                    <p className="text-muted-foreground">Planlegg og administrer møter</p>
                </div>
                <Link
                    href={`/org/${slug}/moter/ny`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Nytt møte
                </Link>
            </div>

            {/* Upcoming Meetings */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Kommende møter</h2>
                {upcoming.length === 0 ? (
                    <div className="text-gray-500 text-sm py-4 bg-gray-50 rounded-lg text-center border border-dashed border-gray-200">
                        Ingen planlagte møter.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {upcoming.map(meeting => (
                            <MeetingCard key={meeting.id} meeting={meeting} slug={slug} />
                        ))}
                    </div>
                )}
            </div>

            {/* Past Meetings */}
            {past.length > 0 && (
                <div className="space-y-4 pt-4 opacity-75">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Tidligere møter</h2>
                    <div className="grid gap-4">
                        {past.map(meeting => (
                            <MeetingCard key={meeting.id} meeting={meeting} slug={slug} isPast />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function MeetingCard({ meeting, slug, isPast }: { meeting: any, slug: string, isPast?: boolean }) {
    const date = new Date(meeting.meeting_date)

    const typeDetails: Record<string, { label: string, color: string }> = {
        board: { label: 'Styremøte', color: 'bg-purple-100 text-purple-800' },
        general: { label: 'Generalforsamling', color: 'bg-blue-100 text-blue-800' },
        annual: { label: 'Årsmøte', color: 'bg-indigo-100 text-indigo-800' },
        other: { label: 'Annet', color: 'bg-gray-100 text-gray-800' }
    }
    const type = typeDetails[meeting.meeting_type] || typeDetails['other']

    return (
        <Link
            href={`/org/${slug}/moter/${meeting.id}`}
            className={`block bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow ${isPast ? 'bg-gray-50' : ''}`}
        >
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    {/* Date Box */}
                    <div className="flex flex-col items-center bg-gray-100 rounded-lg p-2 min-w-[3.5rem] border border-gray-200">
                        <span className="text-xs font-semibold text-gray-500 uppercase">{format(date, 'MMM', { locale: nb })}</span>
                        <span className="text-xl font-bold text-gray-900">{format(date, 'd')}</span>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {meeting.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${type.color}`}>
                                {type.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {format(date, 'HH:mm')}
                            </span>
                            {meeting.location && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {meeting.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
            </div>
        </Link>
    )
}
