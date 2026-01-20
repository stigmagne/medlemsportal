import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PublicRsvpPage({
    params
}: {
    params: Promise<{ meetingId: string, memberId: string, status: string }>
}) {
    const { meetingId, memberId, status } = await params
    const supabase = await createClient()

    // Validate status
    if (!['yes', 'no', 'maybe'].includes(status)) {
        return <div>Ugyldig status</div>
    }

    // Verify meeting exists
    const { data: meeting } = await supabase
        .from('meetings')
        .select('id, title, meeting_date, location, org_id')
        .eq('id', meetingId)
        .single()

    if (!meeting) return <div>Møtet ble ikke funnet</div>

    // Verify member exists
    const { data: member } = await supabase
        .from('members')
        .select('id, first_name')
        .eq('id', memberId)
        .single()

    if (!member) return <div>Medlemmet ble ikke funnet</div>

    // Verify invitation/relationship exists
    const { data: invite } = await supabase
        .from('meeting_attendees')
        .select('id, rsvp_status')
        .eq('meeting_id', meetingId)
        .eq('member_id', memberId)
        .single()

    // If not invited, we could error out or auto-invite. 
    // For security, if they have the link (IDs matched), we assume they can RSVP.
    // But let's require an existing invite row for now to be safe.
    if (!invite) {
        return <div>Du er ikke invitert til dette møtet.</div>
    }

    // Perform Update
    const { error } = await supabase
        .from('meeting_attendees')
        .update({
            rsvp_status: status,
            rsvp_date: new Date().toISOString()
        })
        .eq('meeting_id', meetingId)
        .eq('member_id', memberId)

    if (error) {
        return <div>Det oppstod en feil ved registrering av svar.</div>
    }

    // Get Org info for back link
    const { data: org } = await supabase
        .from('organizations')
        .select('slug, name')
        .eq('id', meeting.org_id)
        .single()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <div className="mb-4 text-green-500 mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Takk for svaret!</h2>
                    <p className="text-gray-600 mb-6">
                        Vi har registrert at <strong>{member.first_name}</strong> svarte: <br />
                        <span className="font-semibold text-lg text-blue-600 uppercase mt-2 inline-block">
                            {status === 'yes' ? 'Kommer' : status === 'no' ? 'Kommer ikke' : 'Kanskje'}
                        </span>
                    </p>

                    <div className="bg-gray-50 rounded p-4 mb-6 text-left">
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <p className="text-sm text-gray-500">
                            {new Date(meeting.meeting_date).toLocaleString('nb-NO')}
                        </p>
                        <p className="text-sm text-gray-500">{meeting.location}</p>
                    </div>

                    {org && (
                        <Link
                            href={`/org/${org.slug}/moter/${meetingId}`}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Gå til møtet i portalen &rarr;
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
