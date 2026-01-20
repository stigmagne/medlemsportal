'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { skipOnboardingStep } from '@/app/actions/onboarding'

export default function Step4Import({ orgId }: { orgId: string, data: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSkip = async () => {
        setLoading(true)
        await skipOnboardingStep(orgId, 4)
        router.push('/onboarding/5')
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Importer medlemmer</h2>
            <p className="mb-6 text-gray-600">
                Har dere medlemslisten i Excel eller CSV? Last den opp her for å komme raskt i gang.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
                <p className="text-gray-500">Dra og slipp fil her eller klikk for å laste opp</p>
                <button className="mt-4 px-4 py-2 bg-gray-100 rounded text-gray-700">Velg fil</button>
            </div>

            <div className="pt-6 flex justify-between">
                <button onClick={() => router.push('/onboarding/3')} className="text-gray-600">← Tilbake</button>
                <div className="flex gap-2">
                    <button
                        onClick={handleSkip}
                        disabled={loading}
                        className="text-gray-500 hover:text-gray-700 px-4 py-2"
                    >
                        Hopp over for nå
                    </button>
                    <button
                        disabled
                        className="bg-blue-600 text-white px-6 py-2 rounded opacity-50 cursor-not-allowed"
                    >
                        Last opp (Kommer snart)
                    </button>
                </div>
            </div>
        </div>
    )
}
