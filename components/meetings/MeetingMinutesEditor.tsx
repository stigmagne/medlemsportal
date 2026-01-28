'use client'

import { useState, useEffect } from 'react'
import { saveMinutes, publishMinutes } from '@/app/actions/minutes'
import { useRouter } from 'next/navigation'

export default function MeetingMinutesEditor({ meetingId, slug, initialData }: { meetingId: string, slug: string, initialData?: any }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('content')
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState(initialData?.content || '')
    const [decisions, setDecisions] = useState(initialData?.decisions || [])
    const [status, setStatus] = useState(initialData?.status || 'draft')

    const handleSave = async () => {
        setLoading(true)
        const res = await saveMinutes(meetingId, content, decisions, slug)
        setLoading(false)
        if (res?.error) alert('Feil ved lagring')
    }

    const handlePublish = async () => {
        if (!confirm('Er du sikker på at du vil fullføre og publisere protokollen? Dette låser møtet.')) return

        setLoading(true)
        const res = await publishMinutes(meetingId, slug)
        if (res?.error) {
            alert(res.error)
            setLoading(false)
        } else {
            setStatus('published')
            router.refresh()
        }
    }

    const addDecision = () => {
        const text = prompt('Skriv inn vedtak:')
        if (text) {
            setDecisions([...decisions, { id: Date.now(), text, type: 'decision' }])
        }
    }

    const removeDecision = (id: number) => {
        setDecisions(decisions.filter((d: any) => d.id !== id))
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                    Møteprotokoll
                    {status === 'published' && <span className="ml-2 text-green-600 text-sm font-normal">(Publisert)</span>}
                </h3>
                <div className="flex gap-2">
                    {status !== 'published' && (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                            >
                                Lagre utkast
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                                Fullfør & Send
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 py-4">
                {/* Simple Tabs */}
                <div className="flex gap-4 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 ${activeTab === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Referat / Tekst
                    </button>
                    <button
                        onClick={() => setActiveTab('decisions')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 ${activeTab === 'decisions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Vedtak ({decisions.length})
                    </button>
                </div>

                {activeTab === 'content' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Møtereferat</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            readOnly={status === 'published'}
                            rows={15}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Skriv referat her..."
                        />
                    </div>
                )}

                {activeTab === 'decisions' && (
                    <div>
                        <div className="mb-4 flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-700">Registrerte vedtak</h4>
                            {status !== 'published' && (
                                <button
                                    onClick={addDecision}
                                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                                >
                                    + Legg til vedtak
                                </button>
                            )}
                        </div>

                        {decisions.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">Ingen vedtak registrert.</p>
                        ) : (
                            <ul className="space-y-3">
                                {decisions.map((d: any, i: number) => (
                                    <li key={d.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded border border-gray-200">
                                        <span className="font-mono text-gray-400 text-sm">#{i + 1}</span>
                                        <span className="flex-1 text-sm text-gray-800">{d.text}</span>
                                        {status !== 'published' && (
                                            <button onClick={() => removeDecision(d.id)} className="text-gray-400 hover:text-red-500">×</button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
