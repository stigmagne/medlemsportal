'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function RsvpPage() {
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
    const [errorMessage, setErrorMessage] = useState('')
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const choice = searchParams.get('status') // Optional pre-selection

    // Auto-submit if both token and status are present (e.g. from specific "Yes" link)
    // But for security, maybe we just show the buttons? 
    // The user requirement said: "User clicks email link -> page shows buttons" in one option,
    // but "automating" it on page load is better UX if the email link was "Click to attend".
    // Let's support both. If query param `status` is set, we try to submit immediately.

    useEffect(() => {
        if (token && choice && status === 'pending') {
            if (['yes', 'no', 'maybe'].includes(choice)) {
                handleRsvp(choice as 'yes' | 'no' | 'maybe')
            }
        }
    }, [token, choice])

    const handleRsvp = async (selectedStatus: 'yes' | 'no' | 'maybe') => {
        try {
            setStatus('pending') // show loading if manual click
            const res = await fetch('/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, status: selectedStatus })
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('success')
            } else {
                setStatus('error')
                setErrorMessage(data.error || 'Noe gikk galt')
            }
        } catch (e) {
            setStatus('error')
            setErrorMessage('Kunne ikke kontakte serveren')
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="bg-white p-8 rounded shadow text-center text-red-600">
                    Ugyldig eller manglende lenke. Sjekk e-posten din på nytt.
                </div>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="mb-4 text-green-500 mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Takk for svaret!</h2>
                        <p className="text-gray-600">Ditt svar er registrert.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Vil du delta?</h2>

                    {status === 'error' && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={() => handleRsvp('yes')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Kommer
                        </button>
                        <button
                            onClick={() => handleRsvp('maybe')}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Kanskje
                        </button>
                        <button
                            onClick={() => handleRsvp('no')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Kommer ikke
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
