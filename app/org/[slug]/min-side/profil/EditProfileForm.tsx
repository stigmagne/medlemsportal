'use client'

import { useActionState, useState } from 'react'
import { updateProfile, type UpdateProfileState } from '../actions'
import { createClient } from '@/lib/supabase/client'

type Member = {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    date_of_birth: string | null
    address: string | null
    postal_code: string | null
    city: string | null
    consent_email: boolean
    consent_sms: boolean
    consent_marketing: boolean
}

const initialState: UpdateProfileState = {}

export default function EditProfileForm({ member }: { member: Member }) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState)
    const [isDownloading, setIsDownloading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Last ned data som JSON
    const handleDownloadData = async () => {
        setIsDownloading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            // Hent medlemsdata
            const { data: memberData } = await supabase
                .from('members')
                .select('*')
                .eq('id', member.id)
                .single()

            // Hent betalingshistorikk
            const { data: payments } = await supabase
                .from('contingent_payments')
                .select('*')
                .eq('member_id', member.id)

            // Hent e-posthistorikk
            const { data: emails } = await supabase
                .from('campaign_recipients')
                .select('*')
                .eq('member_id', member.id)

            // Lag komplett datasett
            const userData = {
                exported_at: new Date().toISOString(),
                member: memberData,
                payments: payments || [],
                email_history: emails || []
            }

            // Last ned som JSON
            const blob = new Blob([JSON.stringify(userData, null, 2)], {
                type: 'application/json'
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `mine-data-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Error downloading data:', error)
            alert('Kunne ikke laste ned data. Prøv igjen.')
        } finally {
            setIsDownloading(false)
        }
    }

    // Slett konto (soft delete + anonymisering)
    const handleDeleteAccount = async () => {
        setIsDeleting(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            // Soft delete + anonymisering
            const { error } = await supabase
                .from('members')
                .update({
                    deleted_at: new Date().toISOString(),
                    // Anonymiser persondata
                    first_name: 'Slettet',
                    last_name: 'Bruker',
                    email: `deleted-${member.id}@anonymized.local`,
                    phone: null,
                    address: null,
                    postal_code: null,
                    city: null,
                    date_of_birth: null,
                    notes: null,
                    membership_status: 'inactive'
                })
                .eq('id', member.id)

            if (error) throw error

            // Logg ut brukeren
            await supabase.auth.signOut()

            // Redirect til forside
            window.location.href = '/'

        } catch (error) {
            console.error('Error deleting account:', error)
            alert('Kunne ikke slette konto. Kontakt foreningen.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-8">
            <form action={formAction} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Rediger din informasjon
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Oppdater din kontaktinformasjon og samtykker.
                        </p>
                    </div>

                    {state.error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                            {state.error}
                        </div>
                    )}

                    {state.success && (
                        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                            {state.message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <input type="hidden" name="memberId" value={member.id} />
                        {/* Public/Editable Fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fornavn
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                defaultValue={member.first_name}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Etternavn
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                defaultValue={member.last_name}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Telefon
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                defaultValue={member.phone || ''}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                E-post (kan ikke endres)
                            </label>
                            <input
                                type="email"
                                defaultValue={member.email || ''}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-500">Kontakt oss for å endre e-postadresse.</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
                            Adresse
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Gateadresse
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    defaultValue={member.address || ''}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Postnummer
                                </label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    defaultValue={member.postal_code || ''}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Poststed
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    defaultValue={member.city || ''}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
                            Samtykker
                        </h3>
                        <div className="space-y-4">
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="consent_email"
                                    defaultChecked={member.consent_email}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Samtykke til e-post
                                    </span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                                        Jeg ønsker å motta informasjon og nyhetsbrev på e-post.
                                    </span>
                                </div>
                            </label>
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="consent_sms"
                                    defaultChecked={member.consent_sms}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Samtykke til SMS
                                    </span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                                        Jeg ønsker å motta viktige beskjeder på SMS.
                                    </span>
                                </div>
                            </label>
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="consent_marketing"
                                    defaultChecked={member.consent_marketing}
                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Samtykke til markedsføring
                                    </span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                                        Jeg godtar at foreningen sender meg tilbud fra samarbeidspartnere.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        {isPending ? 'Lagrer...' : 'Lagre endringer'}
                    </button>
                </div>
            </form>

            {/* GDPR & Personvern */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Personvern & Dine rettigheter
                </h2>

                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        I henhold til GDPR har du rett til innsyn i og sletting av dine personopplysninger.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Last ned mine data */}
                        <button
                            onClick={handleDownloadData}
                            disabled={isDownloading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Laster ned...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Last ned mine data</span>
                                </>
                            )}
                        </button>

                        {/* Slett min konto */}
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Slett min konto</span>
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        <a href="/personvern" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
                            Les mer om dine rettigheter i vår personvernerklæring
                        </a>
                    </p>
                </div>
            </section>

            {/* Bekreftelsesdialog for sletting */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Slett min konto
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Er du sikker på at du vil slette kontoen din? Dette vil:
                        </p>
                        <ul className="list-disc pl-5 mb-6 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            <li>Anonymisere dine personopplysninger</li>
                            <li>Fjerne deg fra medlemslisten</li>
                            <li>Slette din innlogging</li>
                            <li>Dette kan IKKE angres</li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Sletter...' : 'Ja, slett min konto'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Avbryt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
