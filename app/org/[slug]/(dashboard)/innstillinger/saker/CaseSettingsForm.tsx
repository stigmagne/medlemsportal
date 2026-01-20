'use client'

import { updateCaseSettings } from './actions'
import { useTransition, useState } from 'react'

export default function CaseSettingsForm({
    settings,
    slug
}: {
    settings: any
    slug: string
}) {
    const [isPending, startTransition] = useTransition()
    const [format, setFormat] = useState(settings.case_number_format || 'year_seq')

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const res = await updateCaseSettings(slug, formData)
            if (res.error) alert(res.error)
            else alert('Innstillinger lagret!')
        })
    }

    return (
        <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-8 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Saksnummerering</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Velg hvordan saker skal nummereres i protokoller og oversikter.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="radio"
                            name="format"
                            id="fmt_year"
                            value="year_seq"
                            checked={format === 'year_seq'}
                            onChange={() => setFormat('year_seq')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="fmt_year" className="block text-sm font-medium text-gray-700">
                            År/Nummer (eks: 24/001, 24/002...)
                            <span className="block text-xs text-gray-500 font-normal mt-0.5">
                                Starter på 1 hvert nytt år.
                            </span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="radio"
                            name="format"
                            id="fmt_seq"
                            value="seq"
                            checked={format === 'seq'}
                            onChange={() => setFormat('seq')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="fmt_seq" className="block text-sm font-medium text-gray-700">
                            Løpenummer (eks: 1052, 1053...)
                            <span className="block text-xs text-gray-500 font-normal mt-0.5">
                                Fortsetter uavhengig av årsskifte.
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Migrering / Startpunkt</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Hvis dere har brukt et annet system tidligere, kan dere sette siste brukte nummer her, så fortsetter vi på neste.
                </p>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {format === 'year_seq' ? 'Siste år (f.eks 2024)' : 'Siste år (ikke i bruk)'}
                        </label>
                        <input
                            type="number"
                            name="lastYear"
                            defaultValue={settings.last_case_year || new Date().getFullYear()}
                            disabled={format !== 'year_seq'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Siste brukte nummer
                        </label>
                        <input
                            type="number"
                            name="lastNumber"
                            defaultValue={settings.last_case_number || 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                    {isPending ? 'Lagrer...' : 'Lagre innstillinger'}
                </button>
            </div>
        </form>
    )
}
