'use client'

import { completeOnboarding, type OnboardingData } from '../actions'
import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Step6Completion({
    data,
    orgId
}: {
    data: OnboardingData
    orgId: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => {
        setShowConfetti(true)
    }, [])

    const handleComplete = async () => {
        startTransition(async () => {
            const res = await completeOnboarding(orgId)
            if (res.success) {
                // Redirect happened in server action or we force it here
                // Server action redirect might be better but let's be safe
                // Fetch slug logic is in layout, but after completion the layout redirects
                router.refresh()
            }
        })
    }

    return (
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-12 text-center relative overflow-hidden">
            {/* Simple CSS Confetti (simulated with emojis for now) */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none flex justify-between px-10 overflow-hidden" aria-hidden="true">
                    <div className="animate-bounce delay-100 text-4xl">🎉</div>
                    <div className="animate-bounce delay-700 text-4xl">🎊</div>
                    <div className="animate-bounce delay-200 text-4xl">🎈</div>
                    <div className="animate-bounce delay-500 text-4xl">🚀</div>
                    <div className="animate-bounce delay-300 text-4xl">✨</div>
                </div>
            )}

            <div className="relative z-10">
                <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-4">Gratulerer! 👏</h2>
                <p className="text-xl text-gray-600 mb-8">
                    {data.orgName || 'Din Forening'} er nå satt opp og klar til bruk.
                </p>

                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 border border-gray-100 text-left mb-10">
                    <h3 className="font-semibold text-gray-900 mb-4">Hva skjer nå?</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="bg-white p-1 rounded border border-gray-200 mt-0.5">
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <span className="text-gray-600 text-sm">Inviter styret eller importer medlemslisten</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-white p-1 rounded border border-gray-200 mt-0.5">
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-gray-600 text-sm">Planlegg første møte eller send nyhetsbrev</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-white p-1 rounded border border-gray-200 mt-0.5">
                                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <span className="text-gray-600 text-sm">Sett opp Vipps for å motta betalinger</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={handleComplete}
                    disabled={isPending}
                    className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                    {isPending ? 'Klargjør dashboard...' : 'Gå til Dashboard →'}
                </button>
            </div>
        </div>
    )
}
