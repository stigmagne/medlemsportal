'use client'

import { useEffect, useState } from 'react'
import { getOpenCases } from '../actions'

export default function CaseSelector({ slug }: { slug: string }) {
    const [cases, setCases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getOpenCases(slug).then(data => {
            setCases(data)
            setLoading(false)
        })
    }, [slug])

    if (loading) {
        return <div className="text-sm text-gray-500 animate-pulse">Laster saker...</div>
    }

    if (cases.length === 0) {
        return (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md border border-gray-200">
                Ingen åpne saker tilgjengelig. Du kan opprette saker først, eller legge dem til i møtet senere.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600">Velg saker som skal behandles i dette møtet:</p>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                {cases.map(c => (
                    <label key={c.id} className="flex items-start p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center h-5">
                            <input
                                type="checkbox"
                                name="caseIds"
                                value={c.id}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <span className="font-medium text-gray-900">#{c.formatted_id} {c.title}</span>
                            <span className="block text-gray-500 text-xs">Opprettet {new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    )
}
