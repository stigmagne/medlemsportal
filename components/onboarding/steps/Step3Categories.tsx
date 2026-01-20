'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOnboardingProgress } from '@/app/actions/onboarding'

export default function Step3Categories({ orgId, data }: { orgId: string, data: any }) {
    const router = useRouter()
    // Default categories
    const [categories, setCategories] = useState(data?.categories || [
        { name: 'Senior', fee: 500 },
        { name: 'Junior', fee: 200 }
    ])
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        setLoading(true)
        // Here we would ideally save categories to 'membership_fees' or similar DB table
        // For now we just save to progress JSON
        await updateOnboardingProgress(orgId, 3, { categories })
        router.push('/onboarding/4')
    }

    const addCategory = () => setCategories([...categories, { name: '', fee: 0 }])
    const updateCat = (index: number, field: string, value: any) => {
        const newCats = [...categories]
        newCats[index] = { ...newCats[index], [field]: value }
        setCategories(newCats)
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Medlemskategorier</h2>
            <p className="mb-4 text-gray-600">Sett opp de vanligste medlemskapstypene deres.</p>

            <div className="space-y-4 mb-6">
                {categories.map((cat: any, i: number) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={cat.name}
                            onChange={e => updateCat(i, 'name', e.target.value)}
                            placeholder="Navn (f.eks. Senior)"
                            className="flex-1 p-2 border rounded"
                        />
                        <input
                            type="number"
                            value={cat.fee}
                            onChange={e => updateCat(i, 'fee', parseInt(e.target.value))}
                            placeholder="Pris"
                            className="w-24 p-2 border rounded"
                        />
                        <span className="p-2 text-gray-500">kr</span>
                    </div>
                ))}
                <button onClick={addCategory} className="text-blue-600 text-sm font-medium">+ Legg til kategori</button>
            </div>

            <div className="pt-6 flex justify-between">
                <button onClick={() => router.push('/onboarding/2')} className="text-gray-600">← Tilbake</button>
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Lagrer...' : 'Neste →'}
                </button>
            </div>
        </div>
    )
}
