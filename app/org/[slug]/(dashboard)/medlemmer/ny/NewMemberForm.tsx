'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

import { MemberType } from '@/app/actions/member-types'
import { createMember } from '@/app/actions/members'

type NewMemberFormProps = {
    org_id: string
    nextMemberNumber: string
    slug: string
    memberTypes: MemberType[]
}

export default function NewMemberForm({ org_id, nextMemberNumber, slug, memberTypes }: NewMemberFormProps) {
    const router = useRouter()
    const supabase = createClient()

    // Form state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')

    const [address, setAddress] = useState('')
    const [postalCode, setPostalCode] = useState('')
    const [city, setCity] = useState('')

    const [memberNumber] = useState(nextMemberNumber)
    // Default to first type if available, otherwise empty string
    const [memberTypeId, setMemberTypeId] = useState<string>(memberTypes.length > 0 ? memberTypes[0].id : '')
    const [membershipStatus, setMembershipStatus] = useState<'active' | 'inactive' | 'pending'>('active')
    const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0])

    const [consentEmail, setConsentEmail] = useState(true) // Default true
    const [consentSms, setConsentSms] = useState(false)
    const [consentMarketing, setConsentMarketing] = useState(false)

    const [notes, setNotes] = useState('')

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        // Validation
        if (!firstName.trim() || !lastName.trim()) {
            setError('Fornavn og etternavn er påkrevd')
            setLoading(false)
            return
        }

        if (!memberTypeId && memberTypes.length > 0) {
            setError('Vennligst velg en medlemstype')
            setLoading(false)
            return
        }

        try {
            // Find the selected type name to populate the legacy category field
            const selectedType = memberTypes.find(t => t.id === memberTypeId)
            const typeName = selectedType ? selectedType.name : 'Standard'

            const result = await createMember({
                organization_id: org_id,
                member_number: memberNumber,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim() || null,
                phone: phone.trim() || null,
                date_of_birth: dateOfBirth || null,
                address: address.trim() || null,
                postal_code: postalCode.trim() || null,
                city: city.trim() || null,
                membership_category: typeName,
                member_type_id: memberTypeId || null,
                membership_status: membershipStatus,
                joined_date: joinedDate,
                consent_email: consentEmail,
                consent_sms: consentSms,
                consent_marketing: consentMarketing,
                consent_date: (consentEmail || consentSms || consentMarketing) ? new Date().toISOString() : null,
                notes: notes.trim() || null,
                slug: slug
            })

            if (result.error) {
                setError(result.error)
                setLoading(false)
                return
            }

            if (result.warning) {
                // Show warning but proceed
                console.warn(result.warning)
            }

            // Success - redirect to member list
            router.push(`/org/${slug}/medlemmer`)
            router.refresh()
        } catch (err) {
            console.error('Unexpected error:', err)
            setError('En uventet feil oppstod')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Legg til medlem (Dynamisk)
                </h1>
                <Link
                    href={`/org/${slug}/medlemmer`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    ← Tilbake til medlemslisten
                </Link>
            </div>


            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* PERSONALIA */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Personalia
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fornavn <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Etternavn <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            E-post
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fødselsdato
                        </label>
                        <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* ADRESSE */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Adresse
                </h2>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Adresse
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Postnummer
                            </label>
                            <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Poststed
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* MEDLEMSKAP */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Medlemskap
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Medlemsnummer
                        </label>
                        <input
                            type="text"
                            value={memberNumber}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Medlemsnummeret genereres automatisk
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Medlemskategori <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={memberTypeId}
                            onChange={(e) => setMemberTypeId(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Velg type...</option>
                            {memberTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name} ({type.fee} kr)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={membershipStatus}
                            onChange={(e) => setMembershipStatus(e.target.value as 'active' | 'inactive' | 'pending')}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="active">Aktiv</option>
                            <option value="inactive">Inaktiv</option>
                            <option value="pending">Venter</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Innmeldingsdato
                        </label>
                        <input
                            type="date"
                            value={joinedDate}
                            onChange={(e) => setJoinedDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* SAMTYKKER */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Samtykker
                </h2>
                <div className="space-y-3">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={consentEmail}
                            onChange={(e) => setConsentEmail(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Samtykke til e-post
                        </span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={consentSms}
                            onChange={(e) => setConsentSms(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Samtykke til SMS
                        </span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={consentMarketing}
                            onChange={(e) => setConsentMarketing(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Samtykke til markedsføring
                        </span>
                    </label>
                </div>
            </div>

            {/* NOTATER */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Notater
                </h2>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Interne notater om medlemmet..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                    {loading ? 'Lagrer...' : 'Lagre medlem'}
                </button>
                <Link
                    href={`/org/${slug}/medlemmer`}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                    Avbryt
                </Link>
            </div>
        </form>
    )
}
