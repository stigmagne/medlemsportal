'use client'

import { useState } from 'react'
import { inviteMembers } from '@/app/org/[slug]/(dashboard)/moter/actions'

export default function MeetingInvitations({ meetingId, slug, attendees }: { meetingId: string, slug: string, attendees: any[] }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleInvite = async (group: 'board' | 'all') => {
        setLoading(true)
        setMessage('')

        try {
            const res = await inviteMembers(meetingId, slug, group)
            if (res?.error) {
                setMessage(`Feil: ${res.error}`)
            } else {
                setMessage(`Suksess! ${res.count} medlemmer ble lagt til i deltakerlisten.`)
            }
        } catch (e) {
            setMessage('Noe gikk galt.')
        } finally {
            setLoading(false)
        }
    }

    // TODO: Implement "Send Email" functionality here calling sendMeetingInvitation action
    // For now, we focus on populating the list.

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Send invitasjoner</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    Velg hvem som skal inviteres til dette møtet. De vil bli lagt til i deltakerlisten nedenfor.
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={() => handleInvite('board')}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Inviter styret (Admin/Board)
                    </button>

                    <button
                        onClick={() => handleInvite('all')}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Inviter alle medlemmer
                    </button>
                </div>
                {message && <p className="mt-3 text-sm font-medium">{message}</p>}
            </div>

            <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">Sendte invitasjoner / Deltakerliste</h3>
                </div>

                {attendees.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Ingen deltakere lagt til enda.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Navn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Svar mottatt</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {attendees.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {a.member?.first_name} {a.member?.last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${a.rsvp_status === 'yes' ? 'bg-green-100 text-green-800' :
                                                a.rsvp_status === 'no' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {a.rsvp_status === 'pending' ? 'Venter' :
                                                a.rsvp_status === 'yes' ? 'Kommer' :
                                                    a.rsvp_status === 'no' ? 'Kommer ikke' : a.rsvp_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {a.rsvp_date ? new Date(a.rsvp_date).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
