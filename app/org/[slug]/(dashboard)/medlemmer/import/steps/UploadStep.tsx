'use client'

import { ChangeEvent, useState } from 'react'
import Papa from 'papaparse'
import { ImportState } from '../ImportWizard'

type Props = {
    state: ImportState
    setState: (state: ImportState) => void
    onNext: () => void
    onBack: () => void
    org_id: string
    slug: string
}

export default function UploadStep({ state, setState, onNext }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [isParsing, setIsParsing] = useState(false)

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError(null)
        setIsParsing(true)

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Filen må være en CSV-fil (.csv)')
            setIsParsing(false)
            return
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error('CSV Parse Errors:', results.errors)
                    // We allow minor errors but warn if no data
                }

                if (results.data.length === 0) {
                    setError('Filen inneholder ingen data')
                    setIsParsing(false)
                    return
                }

                if (results.meta.fields) {
                    setState({
                        ...state,
                        file: file,
                        data: results.data,
                        headers: results.meta.fields,
                    })
                    setIsParsing(false)
                } else {
                    setError('Kunne ikke lese kolonneoverskrifter. Sjekk filformatet.')
                    setIsParsing(false)
                }
            },
            error: (err) => {
                setError(`Feil ved lesing av fil: ${err.message}`)
                setIsParsing(false)
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Last opp medlemsliste
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Last opp en CSV-fil med dine medlemmer. Første rad må inneholde kolonnenavn.
                </p>
            </div>

            <div className="max-w-xl mx-auto">
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-500 transition-colors">
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Last opp en fil</span>
                                <input id="file-upload" name="file-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileUpload} />
                            </label>
                            <p className="pl-1">eller dra og slipp</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            CSV opp til 10MB
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Success / Status */}
                {state.file && !error && (
                    <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Fil lest vellykket
                                </h3>
                                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                    <p>Filnavn: {state.file.name}</p>
                                    <p>Antall rader: {state.data.length}</p>
                                    <p>Kolonner funnet: {state.headers.join(', ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onNext}
                        disabled={!state.file || isParsing || !!error}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                    >
                        Neste: Koble kolonner →
                    </button>
                </div>
            </div>
        </div>
    )
}
