'use client'

import { createEvent } from '@/app/actions/events'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateEventForm({ slug, orgId }: { slug: string, orgId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        time: '18:00',
        location: '',
        open_for: 'all' as 'all' | 'members_only' | 'non_members_only',
        base_price: '' as string | number,
        member_price: 0,
        requires_active_membership: false,
        requires_prev_year_payment: false,
        products: [] as Array<{ name: string; price: number }>,
        price_type: 'price' as 'price' | 'deductible'
    })

    const handleAddProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { name: '', price: 0 }]
        }))
    }

    const handleRemoveProduct = (index: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }))
    }

    const handleProductChange = (index: number, field: 'name' | 'price', value: string | number) => {
        setFormData(prev => {
            const newProducts = [...prev.products]
            newProducts[index] = { ...newProducts[index], [field]: value }
            return { ...prev, products: newProducts }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Combine date and time
        const isoDate = new Date(`${formData.event_date}T${formData.time}`).toISOString()

        const res = await createEvent({
            orgSlug: slug,
            title: formData.title,
            description: formData.description,
            event_date: isoDate,
            location: formData.location,
            open_for: formData.open_for,
            base_price: Number(formData.base_price),
            member_price: Number(formData.member_price),
            requires_active_membership: formData.requires_active_membership,
            requires_prev_year_payment: formData.requires_prev_year_payment,
            products: formData.products.filter(p => p.name.trim() !== ''),
            price_type: formData.price_type
        })

        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push(`/org/${slug}/dashboard/arrangementer`)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-3xl">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Basisinformasjon</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Navn på arrangement *</label>
                    <input
                        required
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="F.eks. Årsfest 2026"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                    <textarea
                        className="w-full p-2 border rounded-md"
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Hva skjer på arrangementet?"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dato *</label>
                        <input
                            required
                            type="date"
                            className="w-full p-2 border rounded-md"
                            value={formData.event_date}
                            onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tidspunkt *</label>
                        <input
                            required
                            type="time"
                            className="w-full p-2 border rounded-md"
                            value={formData.time}
                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sted</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="F.eks. Rådhuset eller Digitalt (Teams)"
                    />
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Påmelding og Pris</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hvem kan delta?
                    </label>
                    <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, open_for: 'all' })}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${formData.open_for === 'all'
                                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Åpent for alle
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, open_for: 'members_only' })}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${formData.open_for === 'members_only'
                                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Kun for medlemmer
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pris per deltaker (egenandel)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">kr</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full pl-8 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.base_price}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '')
                                setFormData({ ...formData, base_price: val })
                            }}
                            placeholder="0"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">La stå tom eller sett til 0 for gratis.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benevnelse</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="price_type"
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                checked={formData.price_type === 'price'}
                                onChange={() => setFormData({ ...formData, price_type: 'price' })}
                            />
                            <span className="text-sm text-gray-700">Pris per deltaker</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="price_type"
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                checked={formData.price_type === 'deductible'}
                                onChange={() => setFormData({ ...formData, price_type: 'deductible' })}
                            />
                            <span className="text-sm text-gray-700">Egenandel</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.requires_active_membership}
                            onChange={e => setFormData({ ...formData, requires_active_membership: e.target.checked })}
                        />
                        <span className="text-sm font-medium text-gray-700">Kun betalende medlemmer (inneværende år)</span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.requires_prev_year_payment}
                            onChange={e => setFormData({ ...formData, requires_prev_year_payment: e.target.checked })}
                        />
                        <span className="text-sm font-medium text-gray-700">Må ha betalt fjorårets kontingent</span>
                    </label>
                </div>
            </div>

            {/* Product Options (Tilleggsvalg) */}
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-xl font-semibold">Tilleggsvalg (Valgfritt)</h2>
                    <button
                        type="button"
                        onClick={handleAddProduct}
                        className="text-sm text-blue-600 font-medium hover:text-blue-800"
                    >
                        + Legg til valg
                    </button>
                </div>

                {formData.products.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Ingen tilleggsvalg lagt til enda.</p>
                )}

                <div className="space-y-4">
                    {formData.products.map((product, index) => (
                        <div key={index} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Navn</label>
                                <input
                                    type="text"
                                    placeholder="F.eks. Bankettmiddag"
                                    className="w-full p-2 border rounded-md text-sm"
                                    value={product.name}
                                    onChange={e => handleProductChange(index, 'name', e.target.value)}
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Pris (kr)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-2 border rounded-md text-sm"
                                    value={product.price}
                                    onChange={e => handleProductChange(index, 'price', Number(e.target.value))}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveProduct(index)}
                                className="mt-6 text-red-600 hover:text-red-800 p-1"
                                title="Fjern valg"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                    Avbryt
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Oppretter...' : 'Opprett arrangement'}
                </button>
            </div>
        </form>
    )
}
