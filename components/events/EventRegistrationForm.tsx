'use client'

import { useState } from 'react'
import { registerForEvent } from '@/app/actions/events'

interface Event {
    id: string
    title: string
    event_date: string
    location?: string
    base_price: number
    products: any[]
}

export default function EventRegistrationForm({
    event,
    memberId,
    pendingDebt = 0,
    unpaidYears = [],
    membershipFee = 500,
    forcePayDebt = false
}: {
    event: Event,
    memberId?: string,
    pendingDebt?: number,
    unpaidYears?: number[],
    membershipFee?: number,
    forcePayDebt?: boolean
}) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // ... inside EventRegistrationForm component ...

    const [isMemberCheck, setIsMemberCheck] = useState<boolean | null>(null) // null = hasn't answered yet

    // ... (keep step, loading, error states) ...

    // NO payDebt state anymore. It is mandatory.

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        zip: '',
        city: '',
        birthDate: '',
        selectedProducts: [] as string[],
        interestedInMembership: false
    })

    const handleProductToggle = (productId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedProducts: prev.selectedProducts.includes(productId)
                ? prev.selectedProducts.filter(id => id !== productId)
                : [...prev.selectedProducts, productId]
        }))
    }

    const calculateTotal = () => {
        let total = Number(event.base_price)

        event.products.forEach(p => {
            if (formData.selectedProducts.includes(p.id)) {
                total += Number(p.price)
            }
        })

        // Mandatory Debt
        if (memberId && pendingDebt > 0) {
            total += pendingDebt
        }

        // New Membership
        if (formData.interestedInMembership) {
            total += membershipFee
        }

        return total
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        const res = await registerForEvent({
            event_id: event.id,
            member_id: memberId,
            non_member_name: memberId ? undefined : formData.name,
            non_member_email: memberId ? undefined : formData.email,
            non_member_phone: memberId ? undefined : formData.phone,

            non_member_address: formData.address,
            non_member_zip: formData.zip,
            non_member_city: formData.city,
            non_member_birth_date: formData.birthDate,

            product_ids: formData.selectedProducts,
            interested_in_membership: formData.interestedInMembership,

            pay_debt: true, // Always verify/pay debt if exists
            debt_amount: pendingDebt
        })

        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            // Redirect or show payment link would happen here
        }
    }

    // LOGIN CHECK FLOW
    if (!memberId && isMemberCheck === null) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto text-center space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Er du allerede medlem?</h3>
                <div className="flex flex-col gap-3">
                    <a
                        href={`/login?next=/arrangementer/${event.id}/pamelding`}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Ja, logg inn
                    </a>
                    <button
                        onClick={() => setIsMemberCheck(false)}
                        className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Nei, fortsett som gjest / bli medlem
                    </button>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="bg-green-50 p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold text-green-700 mb-4">✅ Du er påmeldt!</h2>
                <p className="text-green-800 mb-6">Vi har sendt en bekreftelse til din e-post.</p>
                <p className="text-sm text-gray-500">
                    (Dette er en demo. I produksjon ville du nå blitt sendt til Stripe.)
                </p>
                <div className="mt-8 p-4 bg-white rounded border border-green-200 inline-block">
                    <p className="font-bold">Totalt å betale: {calculateTotal()} kr</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Event Info Header */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Din Påmelding</h2>
                <div className="flex justify-between items-center text-gray-700">
                    <span>Pris per person:</span>
                    <span className="font-bold">
                        {event.base_price},-
                    </span>
                </div>
            </div>

            {/* DEBT AUTOMATIC NOTICE */}
            {memberId && pendingDebt > 0 && (
                <div className="bg-orange-50 p-4 border border-orange-200 rounded-lg flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <h4 className="font-semibold text-orange-900">Utestående Kontingent</h4>
                        <p className="text-sm text-orange-800">
                            Du har {pendingDebt},- kr i ubetalt medlemskontingent.
                            Dette beløpet legges automatisk til totalen for denne påmeldingen.
                        </p>
                    </div>
                </div>
            )}

            {!memberId && (
                <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dine opplysninger</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
                        <input
                            type="text"
                            required={!memberId}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ola Nordmann"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                        <input
                            type="email"
                            required={!memberId}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="ola@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                        <input
                            type="tel"
                            required={!memberId}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="900 00 000"
                        />
                    </div>

                    {/* Extended fields for New Membership */}
                    {formData.interestedInMembership && (
                        <div className="pt-4 border-t border-blue-100 mt-4 space-y-4 bg-blue-50 p-4 rounded-md">
                            <h4 className="font-semibold text-blue-900">Innmelding detaljer</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    required={formData.interestedInMembership}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postnr</label>
                                    <input
                                        type="text"
                                        required={formData.interestedInMembership}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        value={formData.zip}
                                        onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Poststed</label>
                                    <input
                                        type="text"
                                        required={formData.interestedInMembership}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fødselsdato</label>
                                <input
                                    type="date"
                                    required={formData.interestedInMembership}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Valg</h3>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Deltakeravgift</span>
                    <span className="font-bold text-gray-900">{event.base_price} kr</span>
                </div>

                {event.products && event.products.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Tillegg:</p>
                        {event.products.map(product => (
                            <label key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                        checked={formData.selectedProducts.includes(product.id)}
                                        onChange={() => handleProductToggle(product.id)}
                                    />
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{product.name}</div>
                                        {product.description && <div className="text-gray-500 text-xs">{product.description}</div>}
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">+{product.price} kr</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {!memberId && (
                <div className="mb-8">
                    <label className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <input
                            type="checkbox"
                            className="h-5 w-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                            checked={formData.interestedInMembership}
                            onChange={e => setFormData({ ...formData, interestedInMembership: e.target.checked })}
                        />
                        <div className="text-sm text-blue-900">
                            <strong>Jeg vil gjerne bli medlem!</strong>
                            <p className="opacity-80 mt-1">Få medlemspris på dette og fremtidige arrangementer, samt støtt vårt arbeid.</p>
                        </div>
                    </label>
                </div>
            )}

            <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-lg text-gray-600">Totalt å betale</span>
                    <span className="text-3xl font-bold text-gray-900">{calculateTotal()} kr</span>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || (!memberId && (!formData.name || !formData.email))}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transform transition hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 shadow-xl shadow-blue-200"
                >
                    {loading ? 'Behandler...' : 'Gå til betaling (Stripe)'}
                </button>
            </div>
        </div>
    )
}
