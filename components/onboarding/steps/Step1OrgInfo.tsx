'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOnboardingProgress } from '@/app/actions/onboarding'
import { CheckCircle } from 'lucide-react'

export default function Step1OrgInfo({ orgSlug, data }: { orgSlug: string, data: any }) {
    const router = useRouter()
    const [orgName, setOrgName] = useState(data?.orgName || '')
    const [orgNumber, setOrgNumber] = useState(data?.orgNumber || '')
    const [contactName, setContactName] = useState(data?.contactName || '')
    const [loading, setLoading] = useState(false)

    // Check if data was pre-filled from registration
    const isPreFilled = !!(data?.orgName || data?.contactName)

    const handleNext = async () => {
        setLoading(true)
        await updateOnboardingProgress(orgSlug, 1, { orgName, orgNumber, contactName })
        router.push('/onboarding/2')
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Velkommen til Din Forening</h2>

            {isPreFilled ? (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-green-800 dark:text-green-200 font-medium">Informasjon hentet fra registreringen</p>
                        <p className="text-sm text-green-700 dark:text-green-300">Se over og gjør eventuelle endringer før du går videre.</p>
                    </div>
                </div>
            ) : (
                <p className="mb-6 text-gray-600 dark:text-gray-400">La oss starte med litt informasjon om organisasjonen.</p>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Organisasjonsnavn</label>
                    <input
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="F.eks. Idrettslag IL"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Organisasjonsnummer</label>
                    <input
                        value={orgNumber}
                        onChange={e => setOrgNumber(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="9 sifre"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Kreves for å motta betalinger via Stripe
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kontaktperson</label>
                    <input
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Navn Navnesen"
                    />
                </div>

                <div className="pt-6 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={loading || !orgName}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Lagrer...' : 'Neste →'}
                    </button>
                </div>
            </div>
        </div>
    )
}
