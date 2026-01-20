'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MemberType } from '@/app/actions/member-types'

type Member = {
    id: string
    member_number: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    date_of_birth: string | null
    address: string | null
    postal_code: string | null
    city: string | null
    membership_category: string | null
    member_type_id: string | null
    membership_status: 'active' | 'inactive' | 'pending'
    joined_date: string | null
    consent_email: boolean
    consent_sms: boolean
    consent_marketing: boolean
    notes: string | null
}

type EditMemberFormProps = {
    member: Member
    org_id: string
    slug: string
    memberTypes: MemberType[]
}

export default function EditMemberForm({ member, org_id, slug, memberTypes }: EditMemberFormProps) {
    const router = useRouter()
    const supabase = createClient()

    // Form state - initialized with existing member data
    const [firstName, setFirstName] = useState(member.first_name)
    const [lastName, setLastName] = useState(member.last_name)
    const [email, setEmail] = useState(member.email || '')
    const [phone, setPhone] = useState(member.phone || '')
    const [dateOfBirth, setDateOfBirth] = useState(member.date_of_birth || '')

    const [address, setAddress] = useState(member.address || '')
    const [postalCode, setPostalCode] = useState(member.postal_code || '')
    const [city, setCity] = useState(member.city || '')

    const [memberNumber] = useState(member.member_number)
    const [memberTypeId, setMemberTypeId] = useState<string>(member.member_type_id || (memberTypes.length > 0 ? memberTypes[0].id : ''))
    const [membershipStatus, setMembershipStatus] = useState<'active' | 'inactive' | 'pending'>(member.membership_status)
    const [joinedDate, setJoinedDate] = useState(member.joined_date || new Date().toISOString().split('T')[0])

    const [consentEmail, setConsentEmail] = useState(member.consent_email)
    const [consentSms, setConsentSms] = useState(member.consent_sms)
    const [consentMarketing, setConsentMarketing] = useState(member.consent_marketing)

    const [notes, setNotes] = useState(member.notes || '')

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

            const { error: updateError } = await supabase
                .from('members')
                .update({
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
                })
                .eq('id', member.id)

            if (updateError) {
                console.error('Error updating member:', {
                    error: updateError,
                    message: updateError?.message,
                    details: updateError?.details,
                    hint: updateError?.hint,
                    code: updateError?.code
                })
                setError('Det oppstod en feil ved oppdatering av medlem')
                setLoading(false)
                return
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

    const handleDelete = async () => {
        setError(null)
        setLoading(true)

        try {
            // Soft delete - set deleted_at timestamp
            const { error: deleteError } = await supabase
                .from('members')
                .update({
                    deleted_at: new Date().toISOString(),
                })
                .eq('id', member.id)

            if (deleteError) {
                console.error('Error deleting member:', {
                    error: deleteError,
                    message: deleteError?.message,
                    details: deleteError?.details,
                    hint: deleteError?.hint,
                    code: deleteError?.code
                })
                setError('Det oppstod en feil ved sletting av medlem')
                setLoading(false)
                return
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
        <>
            <form onSubmit={handleSubmit} className="max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Rediger medlem: {member.first_name} {member.last_name}
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
                <div className="flex gap-4 items-center justify-between">
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'Lagrer...' : 'Lagre endringer'}
                        </button>
                        <Link
                            href={`/org/${slug}/medlemmer`}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                        >
                            Avbryt
                        </Link>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                    >
                        Slett medlem
                    </button>
                </div>
            </form>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Bekreft sletting
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Er du sikker på at du vil slette <strong>{member.first_name} {member.last_name}</strong>?
                            Dette kan ikke angres.
                        </p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                            >
                                {loading ? 'Sletter...' : 'Ja, slett'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
