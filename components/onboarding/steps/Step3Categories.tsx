'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOnboardingProgress, saveMembershipCategories } from '@/app/actions/onboarding'
import { Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react'

export default function Step3Categories({ orgSlug, data }: { orgSlug: string, data: any }) {
    const router = useRouter()
    // Default categories
    const [categories, setCategories] = useState(data?.categories || [
        { name: 'Senior', fee: 500 },
        { name: 'Junior', fee: 200 }
    ])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleNext = async () => {
        setLoading(true)
        setMessage(null)

        // Filter out empty categories
        const validCategories = categories.filter((cat: any) => cat.name?.trim())

        if (validCategories.length === 0) {
            setMessage({ type: 'error', text: 'Legg til minst én medlemskategori' })
            setLoading(false)
            return
        }

        // Save categories to the database
        const result = await saveMembershipCategories(orgSlug, validCategories)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
            setLoading(false)
            return
        }

        // Also save to onboarding progress for reference
        await updateOnboardingProgress(orgSlug, 3, { categories: validCategories })

        router.push('/onboarding/4')
    }

    const addCategory = () => setCategories([...categories, { name: '', fee: 0 }])

    const removeCategory = (index: number) => {
        if (categories.length > 1) {
            setCategories(categories.filter((_: any, i: number) => i !== index))
        }
    }

    const updateCat = (index: number, field: string, value: any) => {
        const newCats = [...categories]
        newCats[index] = { ...newCats[index], [field]: value }
        setCategories(newCats)
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Medlemskategorier</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
                Sett opp medlemskapstypene deres med årlig kontingent. Disse kan endres senere i innstillinger.
            </p>

            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            <div className="space-y-3 mb-6">
                {categories.map((cat: any, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input
                            value={cat.name}
                            onChange={e => updateCat(i, 'name', e.target.value)}
                            placeholder="Navn (f.eks. Senior)"
                            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                        <div className="flex items-center">
                            <input
                                type="number"
                                value={cat.fee}
                                onChange={e => updateCat(i, 'fee', parseInt(e.target.value) || 0)}
                                placeholder="Pris"
                                className="w-24 p-2 border rounded-l dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 rounded-r text-gray-600 dark:text-gray-300">
                                kr/år
                            </span>
                        </div>
                        {categories.length > 1 && (
                            <button
                                onClick={() => removeCategory(i)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Fjern kategori"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={addCategory}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Legg til kategori
                </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Tips:</strong> Vanlige kategorier er Senior, Junior, Familie, Student, Pensjonist og Æresmedlem.
                </p>
            </div>

            <div className="pt-6 flex justify-between">
                <button
                    onClick={() => router.push('/onboarding/2')}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800"
                >
                    ← Tilbake
                </button>
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Lagrer kategorier...' : 'Neste →'}
                </button>
            </div>
        </div>
    )
}
