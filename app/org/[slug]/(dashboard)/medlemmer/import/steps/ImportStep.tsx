'use client'

import { useEffect, useState, useRef } from 'react'
import { ImportState } from '../ImportWizard'
import { importMembers, MappedMember } from '../actions'
import Link from 'next/link'

type Props = {
    state: ImportState
    setState: (state: ImportState) => void
    org_id: string
    slug: string
}

export default function ImportStep({ state, org_id, slug }: Props) {
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle')
    const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null)
    const hasRun = useRef(false)

    useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

        const runImport = async () => {
            setStatus('processing')

            // Transform data based on mapping
            const mappedData: MappedMember[] = state.data.map(row => {
                const member: any = {}
                Object.entries(state.mapping).forEach(([fieldKey, header]) => {
                    member[fieldKey] = row[header]
                })
                return member as MappedMember
            })

            try {
                const res = await importMembers(org_id, mappedData)
                setResult({ count: res.count, errors: res.errors })
                setStatus('completed')
            } catch (err) {
                console.error('Import failed', err)
                setStatus('error')
            }
        }

        runImport()
    }, [state.data, state.mapping, org_id]) // Dependencies need to be stable or use Ref to prevent double-fire in StrictMode

    if (status === 'processing') {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">Importerer medlemmer...</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Dette kan ta noen sekunder. Vennligst vent.</p>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="text-center py-12">
                <div className="bg-red-100 dark:bg-red-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Noe gikk galt</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">En kritisk feil oppstod under importen.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium">
                    Prøv igjen
                </button>
            </div>
        )
    }

    if (status === 'completed' && result) {
        return (
            <div className="max-w-xl mx-auto py-8">
                <div className="text-center mb-8">
                    <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import fullført!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Vi har behandlet <strong>{state.data.length}</strong> rader.
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-center">
                        <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Importert vellykket</dt>
                            <dd className="text-3xl font-bold text-green-600 dark:text-green-400">{result.count}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Feilet / Hoppet over</dt>
                            <dd className="text-3xl font-bold text-red-600 dark:text-red-400">{result.errors.length}</dd>
                        </div>
                    </dl>
                </div>

                {result.errors.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Detaljer om feil/hoppet over:</h3>
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 max-h-48 overflow-y-auto border border-red-100 dark:border-red-900/30">
                            <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                                {result.errors.map((err, idx) => (
                                    <li key={idx}>• {err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <Link
                        href={`/org/${slug}/medlemmer`}
                        className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        Gå til medlemslisten
                    </Link>
                </div>
            </div>
        )
    }

    return null
}
