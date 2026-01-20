'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOnboardingProgress } from '@/app/actions/onboarding'

export default function Step5Email({ orgId, data }: { orgId: string, data: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const defaultSubject = 'Velkommen til medlemsportalen!'
    const defaultBody = 'Hei,\n\nVi har fått nytt medlemsregister. Logg inn for å se dine opplysninger.'

    const [subject, setSubject] = useState(data?.emailSubject || defaultSubject)
    const [body, setBody] = useState(data?.emailBody || defaultBody)

    const handleNext = async () => {
        setLoading(true)
        await updateOnboardingProgress(orgId, 5, { emailSubject: subject, emailBody: body })
        router.push('/onboarding/6')
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Velkomst-epost</h2>
            <p className="mb-6 text-gray-600">Klargjør e-posten som sendes når dere inviterer medlemmer.</p>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Emne</label>
                    <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Melding</label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="w-full p-2 border rounded h-32"
                    />
                </div>
            </div>

            <div className="pt-6 flex justify-between">
                <button onClick={() => router.push('/onboarding/4')} className="text-gray-600">← Tilbake</button>
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Ferdig →' : 'Ferdig →'}
                </button>
            </div>
        </div>
    )
}
