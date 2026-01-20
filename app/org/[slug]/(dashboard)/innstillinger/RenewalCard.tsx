'use client'

import { runNewYearRenewal } from '@/app/actions/settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { FileWarning, PlayCircle } from 'lucide-react'

export default function RenewalCard({ orgId }: { orgId: string }) {
    const [loading, setLoading] = useState(false)

    // Default to current year or next year depending on date? 
    // Let's just assume "Next Year" or current. 
    // Usually one starts the new year in Jan.
    const currentYear = new Date().getFullYear()

    const handleRun = async () => {
        const confirmed = confirm(
            `Er du sikker?\n\nDette vil generere fakturaer for kontingent (${currentYear}) til ALLE aktive medlemmer.\n\nDette kan ikke angres automatisk.`
        )
        if (!confirmed) return

        setLoading(true)
        const res = await runNewYearRenewal(orgId, currentYear)

        if (res.error) {
            alert(res.error)
        } else {
            alert(`Suksess! Genererte ${res.count} fakturaer.`)
        }
        setLoading(false)
    }

    return (
        <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <PlayCircle className="h-5 w-5" />
                    Start Nytt År
                </CardTitle>
                <CardDescription className="text-blue-700">
                    Kjør i gang {currentYear}. Sender ut kontingentkrav.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-white p-4 rounded-md border border-blue-100 mb-4 text-sm text-gray-600">
                    Pass på at kontingentsatsen er riktig satt før du kjører denne prosessen.
                    Når du trykker start, vil systemet opprette "Pending" betalinger for alle medlemmer.
                </div>

                <button
                    onClick={handleRun}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {loading ? 'Prosesserer...' : `Kjør Årskjøring ${currentYear}`}
                </button>
            </CardContent>
        </Card>
    )
}
