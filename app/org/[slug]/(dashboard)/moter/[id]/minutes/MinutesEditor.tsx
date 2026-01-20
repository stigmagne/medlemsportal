'use client'

import { useState, useTransition } from 'react'
import { saveMinutes, publishMinutes } from './actions'
import { useRouter } from 'next/navigation'

export default function MinutesEditor({
    meetingId,
    initialData,
    slug
}: {
    meetingId: string
    initialData: any
    slug: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // State
    const [notes, setNotes] = useState(initialData?.content || '')
    const [decisions, setDecisions] = useState<string[]>(initialData?.decisions || [])
    const [actions, setActions] = useState<any[]>(initialData?.action_items || [])

    // Helpers
    const addDecision = () => setDecisions([...decisions, ''])
    const updateDecision = (idx: number, val: string) => {
        const newDecisions = [...decisions]
        newDecisions[idx] = val
        setDecisions(newDecisions)
    }
    const removeDecision = (idx: number) => {
        const newDecisions = [...decisions]
        newDecisions.splice(idx, 1)
        setDecisions(newDecisions)
    }

    const addAction = () => setActions([...actions, { what: '', who: '' }])
    const updateAction = (idx: number, field: string, val: string) => {
        const newActions = [...actions]
        newActions[idx] = { ...newActions[idx], [field]: val }
        setActions(newActions)
    }
    const removeAction = (idx: number) => {
        const newActions = [...actions]
        newActions.splice(idx, 1)
        setActions(newActions)
    }

    const handleSave = () => {
        startTransition(async () => {
            const res = await saveMinutes(meetingId, { notes, decisions, actions })
            if (res?.error) alert(res.error)
            else {
                // optional toast
                router.refresh()
            }
        })
    }

    const handlePublish = () => {
        if (!confirm('Er du sikker? Dette vil gjøre referatet synlig for alle deltakere.')) return
        startTransition(async () => {
            await saveMinutes(meetingId, { notes, decisions, actions })
            await publishMinutes(meetingId)
            router.refresh()
            router.push(`/org/${slug}/moter/${meetingId}`)
        })
    }

    return (
        <div className="bg-white shadow rounded-lg p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900">Skriv Referat / Protokoll</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        {isPending ? 'Lagrer...' : 'Lagre utkast'}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                        Publiser & Ferdigstill
                    </button>
                </div>
            </div>

            {/* Main Notes */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Møtereferat / Diskusjon</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={10}
                    className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Skriv generell diskusjon og notater her..."
                />
            </div>

            {/* Decisions */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-900">Vedtak</label>
                    <button onClick={addDecision} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Legg til vedtak</button>
                </div>
                {decisions.length === 0 && <p className="text-sm text-gray-400 italic">Ingen vedtak registrert.</p>}
                <div className="space-y-2">
                    {decisions.map((decision, idx) => (
                        <div key={idx} className="flex gap-2">
                            <span className="py-2 text-gray-500 font-mono text-sm">#{idx + 1}</span>
                            <input
                                type="text"
                                value={decision}
                                onChange={(e) => updateDecision(idx, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Beskriv vedtaket..."
                            />
                            <button onClick={() => removeDecision(idx)} className="text-red-500 hover:text-red-700 px-2">
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Items */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-900">Oppgaver / Aksjonspunkter</label>
                    <button onClick={addAction} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Legg til oppgave</button>
                </div>
                {actions.length === 0 && <p className="text-sm text-gray-400 italic">Ingen oppgaver registrert.</p>}
                <div className="space-y-2">
                    {actions.map((action, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                            <input
                                type="text"
                                value={action.what}
                                onChange={(e) => updateAction(idx, 'what', e.target.value)}
                                className="flex-[2] px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Hva skal gjøres?"
                            />
                            <input
                                type="text"
                                value={action.who}
                                onChange={(e) => updateAction(idx, 'who', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Ansvarlig"
                            />
                            <button onClick={() => removeAction(idx)} className="text-red-500 hover:text-red-700 px-2 py-2">
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
