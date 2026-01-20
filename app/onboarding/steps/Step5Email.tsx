'use client'

import { updateOnboardingStep, type OnboardingData } from '../actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function Step5Email({
    data,
    orgId
}: {
    data: OnboardingData
    orgId: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Default welcome message
    const defaultMessage = `Hei!\n\nVelkommen til ${data.orgName || 'oss'} sin nye medlemsportal. Her kan du:\n\n- Se dine medlemsopplysninger\n- Betale kontingent\n- Motta viktige meldinger\n\nVi håper du får nytte av løsningen!`

    const [message, setMessage] = useState(defaultMessage)
    const [isSendingTest, setIsSendingTest] = useState(false)

    const handleSendTest = () => {
        setIsSendingTest(true)
        // Simulate API call
        setTimeout(() => {
            setIsSendingTest(false)
            alert('Test-epost sendt til din adresse!')
        }, 1000)
    }

    const handleSubmit = async () => {
        startTransition(async () => {
            const res = await updateOnboardingStep(orgId, 5, {
                // In reality we would save the template preference here
            })

            if (res.success) {
                router.push(`/onboarding/${res.nextStep}`)
            }
        })
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Velkomstmelding</h2>
            <p className="text-gray-500 mb-6 text-sm">
                Vi sender denne e-posten til nye medlemmer du inviterer.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Editor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tilpass meldingen
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-sans"
                    />
                </div>

                {/* Preview */}
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">
                        Forhåndsvisning
                    </label>
                    <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-4">
                        <div className="border-b pb-4 mb-4">
                            <div className="text-xl font-bold text-gray-900">{data.orgName || 'Din Forening'}</div>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                            {message}
                        </div>
                        <div className="pt-6 mt-6 border-t">
                            <button className="w-full bg-blue-600 text-white py-2 rounded font-medium text-sm">
                                Logg inn i portalen
                            </button>
                        </div>
                        <div className="text-center text-xs text-gray-400 mt-4">
                            Sendt via Medlemsportalen
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
                <button
                    onClick={handleSendTest}
                    disabled={isSendingTest}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                >
                    {isSendingTest ? (
                        <span className="animate-pulse">Sender...</span>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Send test til meg selv
                        </>
                    )}
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                    {isPending ? 'Lagrer...' : 'Fullfør Oppsett →'}
                </button>
            </div>
        </div>
    )
}
