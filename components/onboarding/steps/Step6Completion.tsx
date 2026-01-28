'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/actions/onboarding'

export default function Step6Completion({ orgSlug }: { orgSlug: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleComplete = async () => {
        setLoading(true)
        await completeOnboarding(orgSlug)
        // Redirect to the org dashboard after completing onboarding
        router.push(`/org/${orgSlug}/dashboard`)
    }

    return (
        <div className="text-center py-8">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-4">Gratulerer!</h2>
            <p className="text-xl text-gray-600 mb-8">
                Organisasjonen er nå satt opp og klar til bruk.
            </p>

            <button
                onClick={handleComplete}
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
                {loading ? 'Laster...' : 'Gå til Dashboard'}
            </button>
        </div>
    )
}
