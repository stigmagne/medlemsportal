'use client'

import { inviteMembers, sendMeetingInvitation } from '../actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function InviteControls({
    meetingId,
    slug
}: {
    meetingId: string
    slug: string
}) {
    const [isPending, startTransition] = useTransition()
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleInvite = (group: 'board' | 'all') => {
        if (!confirm(`Er du sikker på at du vil invitere ${group === 'board' ? 'hele styret' : 'alle medlemmer'}?`)) return

        startTransition(async () => {
            const res = await inviteMembers(meetingId, slug, group)
            if (res.error) {
                alert(res.error)
            } else {
                alert(`La til ${res.count} medlemmer i deltakerlisten.`)
                setIsOpen(false)
                router.refresh()
            }
        })
    }

    const handleSendEmails = () => {
        if (!confirm('Vil du sende e-postinnkalling til alle som ikke har svart?')) return
        startTransition(async () => {
            const res = await sendMeetingInvitation(meetingId, slug)
            if (res.success) alert('E-poster er lagt i kø (Mock).')
        })
    }

    return (
        <div className="relative inline-block text-left">
            {!isOpen ? (
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 font-medium text-gray-700"
                    >
                        + Legg til deltakere
                    </button>
                    <button
                        onClick={handleSendEmails}
                        disabled={isPending}
                        className="text-sm bg-blue-600 border border-transparent px-3 py-1.5 rounded hover:bg-blue-700 font-medium text-white disabled:opacity-50"
                    >
                        {isPending ? 'Sender...' : 'Send innkalling'}
                    </button>
                </div>
            ) : (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 p-2">
                    <div className="py-1 flex flex-col gap-1">
                        <button
                            onClick={() => handleInvite('board')}
                            disabled={isPending}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left rounded-md"
                        >
                            Inviter Styret
                        </button>
                        <button
                            onClick={() => handleInvite('all')}
                            disabled={isPending}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left rounded-md"
                        >
                            Inviter Alle Medlemmer
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-2 text-xs text-gray-400 hover:text-gray-600 w-full text-left border-t border-gray-100 mt-1"
                        >
                            Avbryt
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
