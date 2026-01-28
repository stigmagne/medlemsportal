'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOnboardingProgress } from '@/app/actions/onboarding'

export default function Step1OrgInfo({ orgSlug, data }: { orgSlug: string, data: any }) {
    const router = useRouter()
    const [orgName, setOrgName] = useState(data?.orgName || '')
    const [orgNumber, setOrgNumber] = useState(data?.orgNumber || '')
    const [contactName, setContactName] = useState(data?.contactName || '')
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        setLoading(true)
        await updateOnboardingProgress(orgSlug, 1, { orgName, orgNumber, contactName })
        router.push('/onboarding/2')
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Velkommen til Din Forening</h2>
            <p className="mb-6 text-gray-600">La oss starte med litt informasjon om organisasjonen.</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Organisasjonsnavn</label>
                    <input
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="F.eks. Idrettslag IL"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Organisasjonsnummer</label>
                    <input
                        value={orgNumber}
                        onChange={e => setOrgNumber(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="9 sifre"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Kontaktperson</label>
                    <input
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        className="w-full p-2 border rounded"
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
