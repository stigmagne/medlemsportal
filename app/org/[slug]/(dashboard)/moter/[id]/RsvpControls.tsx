'use client'

import { updateRsvp } from '../actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function RsvpControls({
    meetingId,
    slug,
    currentStatus
}: {
    meetingId: string
    slug: string
    currentStatus: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleRsvp = (status: string) => {
        startTransition(async () => {
            const res = await updateRsvp(meetingId, slug, status)
            if (res.error) alert(res.error)
            else router.refresh()
        })
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6 border-l-4 border-l-blue-500">
            <h3 className="font-semibold text-gray-900 mb-4">Kommer du på møtet?</h3>
            <div className="flex gap-3">
                <button
                    onClick={() => handleRsvp('yes')}
                    disabled={isPending}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border ${currentStatus === 'yes'
                            ? 'bg-green-600 text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                        }`}
                >
                    Ja, jeg kommer
                </button>
                <button
                    onClick={() => handleRsvp('maybe')}
                    disabled={isPending}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border ${currentStatus === 'maybe'
                            ? 'bg-yellow-500 text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-50'
                        }`}
                >
                    Kanskje
                </button>
                <button
                    onClick={() => handleRsvp('no')}
                    disabled={isPending}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border ${currentStatus === 'no'
                            ? 'bg-red-600 text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'
                        }`}
                >
                    Nei, kan ikke
                </button>
            </div>
            {currentStatus !== 'pending' && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                    Du har svart: <span className="font-medium">
                        {currentStatus === 'yes' ? 'Kommer' : currentStatus === 'no' ? 'Kommer ikke' : 'Usikker'}
                    </span>
                </p>
            )}
        </div>
    )
}
