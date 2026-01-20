'use client'

import { updateOnboardingStep, type OnboardingData } from '../actions'
import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Category = {
    name: string
    price: number
    description: string
}

const TEMPLATES: Record<string, Category[]> = {
    idrett: [
        { name: 'Senior', price: 500, description: 'Voksne medlemmer over 18 år' },
        { name: 'Junior', price: 300, description: 'Ungdom 13-18 år' },
        { name: 'Barn', price: 150, description: 'Barn under 13 år' },
        { name: 'Støttemedlem', price: 200, description: 'For de som vil støtte klubben' },
    ],
    kultur: [
        { name: 'Aktiv', price: 600, description: 'Ordinært, aktivt medlem' },
        { name: 'Student', price: 300, description: 'Student/Honnør' },
        { name: 'Passiv', price: 200, description: 'Støttemedlem' },
    ],
    ffo: [
        { name: 'Hovedmedlem', price: 400, description: 'Ordinært medlemskap' },
        { name: 'Husstandsmedlem', price: 100, description: 'For øvrige i samme husstand' },
        { name: 'Støttemedlem', price: 250, description: 'Ikke-diagnosebærer' },
    ],
    borettslag: [
        { name: 'Seksjonseier', price: 0, description: 'Eier av boenhet' },
        { name: 'Leietaker', price: 0, description: 'Leier boenhet' },
    ],
    annet: [
        { name: 'Ordinær', price: 500, description: 'Standard medlemskap' },
        { name: 'Støttemedlem', price: 200, description: 'Støttemedlem' },
    ]
}

export default function Step3Categories({
    data,
    orgId
}: {
    data: OnboardingData
    orgId: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Determine default categories based on org type from Step 1
    // or use saved categories if they exist (user went back)
    const orgType = data.orgType || 'annet'
    const defaultCats = data.categories && data.categories.length > 0
        ? data.categories
        : TEMPLATES[orgType] || TEMPLATES['annet']

    const [categories, setCategories] = useState<Category[]>(defaultCats)
    const [mode, setMode] = useState<'template' | 'custom'>('template')

    // Reset to template defaults if orgType changes and no saved data
    useEffect(() => {
        if (!data.categories) {
            setCategories(TEMPLATES[orgType] || TEMPLATES['annet'])
        }
    }, [orgType, data.categories])

    const handleAddCategory = () => {
        setCategories([...categories, { name: 'Ny kategori', price: 0, description: '' }])
        setMode('custom')
    }

    const handleRemoveCategory = (index: number) => {
        const newCats = [...categories]
        newCats.splice(index, 1)
        setCategories(newCats)
        setMode('custom')
    }

    const handleChange = (index: number, field: keyof Category, value: string | number) => {
        const newCats = [...categories]
        newCats[index] = { ...newCats[index], [field]: value }
        setCategories(newCats)
        setMode('custom')
    }

    const handleSubmit = async () => {
        startTransition(async () => {
            const res = await updateOnboardingStep(orgId, 3, {
                categories: categories
            })

            if (res.success) {
                router.push(`/onboarding/${res.nextStep}`)
            }
        })
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Medlemskategorier</h2>
            <p className="text-gray-500 mb-6 text-sm">
                Vi har satt opp et forslag basert på at dere er et <strong>{orgType}</strong>.
                Du kan justere dette nå eller senere.
            </p>

            <div className="space-y-4 mb-8">
                {categories.map((cat, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 items-start sm:items-center">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Navn</label>
                            <input
                                type="text"
                                value={cat.name}
                                onChange={(e) => handleChange(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="w-full sm:w-32">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pris (kr)</label>
                            <input
                                type="number"
                                value={cat.price}
                                onChange={(e) => handleChange(index, 'price', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Beskrivelse</label>
                            <input
                                type="text"
                                value={cat.description}
                                onChange={(e) => handleChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <button
                            onClick={() => handleRemoveCategory(index)}
                            className="text-red-500 hover:text-red-700 p-2 mt-4 sm:mt-0"
                            title="Fjern kategori"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}

                <button
                    onClick={handleAddCategory}
                    className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 px-2 py-1"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Legg til kategori
                </button>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                    {isPending ? 'Lagrer...' : 'Neste steg →'}
                </button>
            </div>
        </div>
    )
}
