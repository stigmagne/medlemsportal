'use server'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

async function getMeeting(id: string) {
    const supabase = await createClient()

    // We fetch a single meeting. Security is handled by RLS (or should be).
    // Application level check: We trust RLS to filter by org usually, 
    // but here we might want to check if the user belongs to the org that owns the meeting.
    // For MVP we assume access if they can read it.

    const { data, error } = await supabase
        .from('meetings')
        .select(`
            *,
            meeting_attendees (
                id,
                rsvp_status,
                member:members (
                    id,
                    first_name,
                    last_name,
                    email
                )
            ),
            case_items (
                id,
                formatted_id,
                title,
                status,
                created_at,
                description
            )
        `)
        .eq('id', id)
        .single()

    if (error || !data) return null

    // Sort cases by number (assuming formatted_id or a separate number field)
    if (data.case_items) {
        data.case_items.sort((a: any, b: any) => a.formatted_id.localeCompare(b.formatted_id))
    }

    return data
}

import MeetingInvitations from '@/components/meetings/MeetingInvitations'
import RsvpControls from './RsvpControls'

export default async function MeetingDetailsPage({
    params
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const meeting = await getMeeting(id)

    if (!meeting) notFound()

    const date = new Date(meeting.meeting_date)

    // Calculate stats
    const totalInvited = meeting.meeting_attendees?.length || 0
    const yes = meeting.meeting_attendees?.filter((a: any) => a.rsvp_status === 'yes').length || 0
    const no = meeting.meeting_attendees?.filter((a: any) => a.rsvp_status === 'no').length || 0
    const pending = meeting.meeting_attendees?.filter((a: any) => a.rsvp_status === 'pending').length || 0

    // Get current user to check if they are invited
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let currentUserAttendee = null
    if (user && meeting.meeting_attendees) {
        currentUserAttendee = meeting.meeting_attendees.find((a: any) => a.member?.email === user.email)
        // Note: Ideally compare by ID if member.user_id was joined, but email is okay for MVP
    }

    return (
        <div className="space-y-8">
            {/* Header / Overview */}
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
                                {meeting.meeting_type}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${meeting.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {meeting.status === 'completed' ? 'Gjennomført' : 'Planlagt'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
                    </div>

                    {/* RSVP Section for current user */}
                    {currentUserAttendee && meeting.status !== 'completed' && (
                        <div className="w-full md:w-auto">
                            {/* Only show compact badge here if answered, full controls below? 
                               Actually, let's just put controls below header or in sidebar. 
                               For now, let's put it prominently if pending.
                           */}
                            {currentUserAttendee.rsvp_status === 'pending' && (
                                <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm">
                                    Du er invitert! Svar nedenfor.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">Dato & Tid</div>
                            <div className="text-gray-600">
                                {format(date, 'd. MMMM yyyy', { locale: nb })}<br />
                                Kl. {format(date, 'HH:mm')}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">Sted</div>
                            <div className="text-gray-600">
                                {meeting.location || 'Ikke spesifisert'}
                                {meeting.digital_link && (
                                    <div className="mt-1 text-sm truncate max-w-[200px]">
                                        <a href={meeting.digital_link} target="_blank" className="text-blue-600 hover:underline">
                                            Digital lenke ↗
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">Påmelding</div>
                            <div className="text-sm">
                                <span className="text-green-600 font-medium">{yes} kommer</span>
                                <span className="text-gray-400 mx-2">|</span>
                                <span className="text-gray-500">{pending} venter svar</span>
                            </div>
                        </div>
                    </div>
                </div>

                {meeting.description && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-2">Beskrivelse</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{meeting.description}</p>
                    </div>
                )}
            </div>

            {/* CASE LIST (SAKER) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Saksliste</h3>
                        <p className="text-sm text-gray-500">Saker som skal behandles i dette møtet</p>
                    </div>
                    <Link
                        href={`/org/${slug}/saker/ny?meetingId=${id}`}
                        className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 font-medium text-gray-700"
                    >
                        + Legg til sak
                    </Link>
                </div>

                {!meeting.case_items || meeting.case_items.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 italic">
                        Ingen saker er lagt til enda.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {meeting.case_items.map((c: any) => (
                            <Link
                                key={c.id}
                                href={`/org/${slug}/saker/${c.id}`}
                                className="block p-6 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm">
                                                #{c.formatted_id}
                                            </span>
                                            <span className="text-xs text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded capitalize">
                                                {c.status === 'draft' ? 'Åpen' : c.status}
                                            </span>
                                        </div>
                                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-700">
                                            {c.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                            {c.description || 'Ingen beskrivelse'}
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Person RSVP */}
            {currentUserAttendee && meeting.status !== 'completed' && (
                <RsvpControls
                    meetingId={id}
                    slug={slug}
                    currentStatus={currentUserAttendee.rsvp_status}
                />
            )}

            {/* Tabs / Actions Placeholder */}
            <div className="flex gap-4 border-b border-gray-200">
                <button className="border-b-2 border-blue-600 text-blue-600 px-4 py-2 font-medium bg-transparent">
                    Detaljer & Deltakere
                </button>
                <Link
                    href={`/org/${slug}/moter/${id}/minutes`}
                    className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-4 py-2 font-medium"
                >
                    Protokoll / Referat
                </Link>
            </div>

            {/* Attendees / Invitations Section */}
            <div id="attendees" className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Deltakere og Invitasjoner</h3>
                </div>
                <div className="p-6">
                    <MeetingInvitations
                        meetingId={id}
                        slug={slug}
                        attendees={meeting.meeting_attendees || []}
                    />
                </div>
            </div>
        </div>
    )
}

function RsvpBadge({ status }: { status: string }) {
    const styles = {
        yes: 'bg-green-100 text-green-800',
        no: 'bg-red-100 text-red-800',
        maybe: 'bg-yellow-100 text-yellow-800',
        pending: 'bg-gray-100 text-gray-800',
    }
    const labels = {
        yes: 'Kommer',
        no: 'Kommer ikke',
        maybe: 'Usikker',
        pending: 'Ikke svart',
    }
    // @ts-ignore
    const style = styles[status] || styles.pending
    // @ts-ignore
    const label = labels[status] || labels.pending

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>
            {label}
        </span>
    )
}
