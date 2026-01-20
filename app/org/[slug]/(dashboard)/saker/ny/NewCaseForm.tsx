'use client'

import { useActionState } from 'react'
import { createCase, getUpcomingMeetings } from './actions'
import { useState, useEffect } from 'react'

const initialState = { error: '' }

export default function NewCaseForm({
    slug
}: {
    slug: string
}) {
    // @ts-ignore
    const [state, formAction] = useActionState(createCase, initialState)

    const [type, setType] = useState<'meeting' | 'email'>('meeting')
    const [votingEnabled, setVotingEnabled] = useState(true)
    const [meetings, setMeetings] = useState<any[]>([])

    // Load meetings on mount
    useEffect(() => {
        getUpcomingMeetings(slug).then(setMeetings)
    }, [slug])

    return (
        <form action={formAction} className="space-y-8 max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <input type="hidden" name="orgSlug" value={slug} />

            {/* Type Selection */}
            <div>
                <label className="text-base font-semibold text-gray-900">Behandlingsmåte</label>
                <div className="mt-4 flex items-center space-x-4">
                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${type === 'meeting' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="type"
                            value="meeting"
                            checked={type === 'meeting'}
                            onChange={() => setType('meeting')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">Styremøte</span>
                            <span className="block text-xs text-gray-500">Saken blir satt på agendaen til et møte</span>
                        </div>
                    </label>

                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${type === 'email' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="type"
                            value="email"
                            checked={type === 'email'}
                            onChange={() => setType('email')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">E-post / Hurtigvedtak</span>
                            <span className="block text-xs text-gray-500">Registrer et vedtak fattet utenom møte</span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Core Info */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Sakstittel</label>
                    <input type="text" name="title" id="title" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" placeholder="Eks: Innkjøp av nytt utstyr" />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        {type === 'meeting' ? 'Beskrivelse / Innstilling' : 'Bakgrunn for vedtaket'}
                    </label>
                    <textarea name="description" id="description" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" placeholder="Beskriv saken..." />
                </div>

                <div>
                    <label htmlFor="attachmentUrl" className="block text-sm font-medium text-gray-700">Vedlegg (URL)</label>
                    <input type="url" name="attachmentUrl" id="attachmentUrl" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" placeholder="https://..." />
                    <p className="mt-1 text-xs text-gray-500">Lim inn lenke til dokument (Google Drive, Dropbox, etc) foreløpig.</p>
                </div>
            </div>

            {/* Meeting Specific */}
            {type === 'meeting' && (
                <div className="pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <label htmlFor="meetingId" className="block text-sm font-medium text-gray-700">Knytt til kommende møte (Valgfritt)</label>
                    <select name="meetingId" id="meetingId" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border">
                        <option value="">-- Velg møte --</option>
                        {meetings.map(m => (
                            <option key={m.id} value={m.id}>
                                {new Date(m.meeting_date).toLocaleDateString()} - {m.title}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Du kan også gjøre dette senere.</p>
                </div>
            )}

            {/* Email Specific */}
            {type === 'email' && (
                <div className="pt-4 border-t rounded-md bg-purple-50 p-4 animate-in fade-in slide-in-from-top-2 border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3">Hastevedtak</h4>

                    <div className="space-y-4">
                        <label className="flex items-start">
                            <input
                                type="checkbox"
                                name="votingEnabled"
                                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                checked={votingEnabled}
                                onChange={(e) => setVotingEnabled(e.target.checked)}
                            />
                            <div className="ml-3 text-sm">
                                <span className="font-medium text-purple-900">Send til digital avstemning i styret</span>
                                <p className="text-purple-700">En e-post sendes til alle styremedlemmer med lenke til avstemning.</p>
                            </div>
                        </label>

                        {votingEnabled ? (
                            <div>
                                <label className="block text-sm font-medium text-purple-800">Frist for avstemning</label>
                                <input
                                    type="datetime-local"
                                    name="votingDeadline"
                                    defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                                    className="mt-1 block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border bg-white"
                                />
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="decision" className="block text-sm font-medium text-purple-800">Vedtakstekst (forehåndsbesluttet)</label>
                                <textarea name="decision" id="decision" required rows={3} className="mt-1 block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border bg-white" placeholder="Hva ble besluttet?" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Submit */}
            <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Opprett Sak
                </button>
            </div>

            {state?.error && (
                <div className="text-red-600 text-sm mt-2 text-center bg-red-50 p-2 rounded">
                    {state.error}
                </div>
            )}
        </form>
    )
}
