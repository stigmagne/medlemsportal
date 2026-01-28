'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOnboardingProgress } from '@/app/actions/onboarding'

export default function Step2Styling({ orgSlug, data }: { orgSlug: string, data: any }) {
    const router = useRouter()
    const [colorTheme, setColorTheme] = useState(data?.colorTheme || 'blue')
    const [loading, setLoading] = useState(false)

    const themes = [
        { id: 'blue', name: 'Blå (Standard)', bg: 'bg-blue-500' },
        { id: 'green', name: 'Grønn', bg: 'bg-green-500' },
        { id: 'red', name: 'Rød', bg: 'bg-red-500' },
    ]

    const handleNext = async () => {
        setLoading(true)
        await updateOnboardingProgress(orgSlug, 2, { colorTheme })
        router.push('/onboarding/3')
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Design og Profil</h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-lg font-medium mb-2">Velg fargetema</label>
                    <div className="grid grid-cols-3 gap-4">
                        {themes.map(theme => (
                            <div
                                key={theme.id}
                                onClick={() => setColorTheme(theme.id)}
                                className={`
                   cursor-pointer border-2 rounded-lg p-4 text-center
                   ${colorTheme === theme.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}
                 `}
                            >
                                <div className={`w-8 h-8 rounded-full ${theme.bg} mx-auto mb-2`}></div>
                                <span className="text-sm">{theme.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 flex justify-between">
                    <button
                        onClick={() => router.push('/onboarding/1')}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ← Tilbake
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Lagrer...' : 'Neste →'}
                    </button>
                </div>
            </div>
        </div>
    )
}
