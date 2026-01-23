'use client'

import { createMeeting } from '../actions'
import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import Link from 'next/link'
import CaseSelector from './CaseSelector'

const initialState = { error: '' }

export default function NewMeetingForm({ slug }: { slug: string }) {
    const [state, dispatch] = useActionState(createMeeting, initialState)

    return (
        <form action={dispatch} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <input type="hidden" name="orgSlug" value={slug} />
            {state?.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {state.error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
                    <input
                        type="text"
                        name="title"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="f.eks. Årsmøte 2026"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                    <textarea
                        name="description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Kort beskrivelse av møtets formål..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dato *</label>
                    <input
                        type="date"
                        name="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Klokkeslett *</label>
                    <input
                        type="time"
                        name="time"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Møtetype *</label>
                    <select
                        name="type"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="board">Styremøte</option>
                        <option value="general">Generalforsamling</option>
                        <option value="annual">Årsmøte</option>
                        <option value="other">Annet</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sted / Lokasjon</label>
                    <input
                        type="text"
                        name="location"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Møterom A eller Oslo Rådhus"
                    />
                </div>
            </div>

            {/* Case Selection */}
            <div className="pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Saker til behandling</h3>
                <CaseSelector slug={slug} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Link
                    href={`/org/${slug}/moter`}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Avbryt
                </Link>
                <SubmitButton />
            </div>
        </form>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
            {pending ? 'Oppretter...' : 'Opprett møte'}
        </button>
    )
}
