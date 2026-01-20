'use client'

import { updateOnboardingStep, type OnboardingData } from '../actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const THEME_COLORS = [
    { name: 'Blå (Standard)', value: 'blue', class: 'bg-blue-600' },
    { name: 'Grønn', value: 'green', class: 'bg-green-600' },
    { name: 'Rød', value: 'red', class: 'bg-red-600' },
    { name: 'Lilla', value: 'purple', class: 'bg-purple-600' },
    { name: 'Svart', value: 'black', class: 'bg-gray-900' },
]

export default function Step2Branding({
    data,
    orgId
}: {
    data: OnboardingData
    orgId: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [selectedColor, setSelectedColor] = useState(data.themeColor || 'blue')

    // Handle form submission
    const handleSubmit = async (formData: FormData) => {
        // Here we would handle file upload for logo if implemented
        // For now we just capture color

        startTransition(async () => {
            const res = await updateOnboardingStep(orgId, 2, {
                themeColor: selectedColor,
                // logoUrl: ... (would come from upload)
            })

            if (res.success) {
                router.push(`/onboarding/${res.nextStep}`)
            }
        })
    }

    const handleSkip = () => {
        startTransition(async () => {
            await updateOnboardingStep(orgId, 2, {}) // Save nothing, just advance
            router.push('/onboarding/3')
        })
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tilpass Utseende</h2>
            <p className="text-gray-500 mb-8 text-sm">
                Velg farger som passer din organisasjon. Du kan endre dette senere.
            </p>

            <form action={handleSubmit} className="space-y-8">
                {/* Logo Upload Placeholder */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
                        <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Klikk for å laste opp logo (PNG, JPG)
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            (Funksjonalitet kommer)
                        </p>
                    </div>
                </div>

                {/* Color Picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Fargetema
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {THEME_COLORS.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => setSelectedColor(color.value)}
                                className={`
                                    relative rounded-lg p-2 border-2 transition-all flex flex-col items-center gap-2
                                    ${selectedColor === color.value
                                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }
                                `}
                            >
                                <div className={`w-8 h-8 rounded-full ${color.class} shadow-sm`} />
                                <span className={`text-xs font-medium ${selectedColor === color.value ? 'text-blue-700' : 'text-gray-600'}`}>
                                    {color.name}
                                </span>
                                {selectedColor === color.value && (
                                    <div className="absolute top-2 right-2 text-blue-600">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleSkip}
                        disabled={isPending}
                        className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm font-medium"
                    >
                        Hopp over
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                        {isPending ? 'Lagrer...' : 'Neste steg →'}
                    </button>
                </div>
            </form>
        </div>
    )
}
