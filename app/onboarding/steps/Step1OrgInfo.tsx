'use client'

import { updateOnboardingStep, type OnboardingData, fetchOrganizationRoles } from '../actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function Step1OrgInfo({
    data,
    orgId
}: {
    data: OnboardingData
    orgId: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    // Brreg state
    const [isValidatingOrg, setIsValidatingOrg] = useState(false)
    const [brregMessage, setBrregMessage] = useState<string | null>(null)
    const [fetchedRoles, setFetchedRoles] = useState<any>(null)

    const handleFetchBrreg = async () => {
        const orgNrInput = document.querySelector('input[name="orgNr"]') as HTMLInputElement
        const orgNameInput = document.querySelector('input[name="orgName"]') as HTMLInputElement

        if (!orgNrInput || !orgNrInput.value) {
            setBrregMessage('Vennligst fyll inn et organisasjonsnummer først.')
            return
        }

        setBrregMessage(null)
        setIsValidatingOrg(true)
        setFetchedRoles(null)

        const result = await fetchOrganizationRoles(orgNrInput.value)
        setIsValidatingOrg(false)

        if (result.error) {
            setBrregMessage(result.error)
        } else if (result.success && result.details) {
            // Auto-fill name if empty or user wants to update
            if (orgNameInput) {
                orgNameInput.value = result.details.navn || ''
            }
            if (result.keyRoles) {
                setFetchedRoles(result.keyRoles)
            }
        }
    }

    const handleSubmit = async (formData: FormData) => {
        setError(null)
        const orgName = formData.get('orgName') as string
        const orgNr = formData.get('orgNr') as string
        const orgType = formData.get('orgType') as string
        const contactName = formData.get('contactName') as string
        const contactEmail = formData.get('contactEmail') as string
        const contactPhone = formData.get('contactPhone') as string

        if (!orgName || !orgType || !contactName || !contactEmail) {
            setError('Vennligst fyll ut alle påkrevde felt.')
            return
        }

        startTransition(async () => {
            try {
                const res = await updateOnboardingStep(orgId, 1, {
                    orgName,
                    orgNr,
                    orgType,
                    contactName,
                    contactEmail,
                    contactPhone
                })

                if (res.success) {
                    router.push(`/onboarding/${res.nextStep}`)
                }
            } catch (e) {
                setError('Noe gikk galt. Prøv igjen.')
            }
        })
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Om Organisasjonen</h2>

            {error && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form action={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organisasjonsnavn *
                        </label>
                        <input
                            type="text"
                            name="orgName"
                            defaultValue={data.orgName}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="f.eks. Solbakken Idrettslag"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organisasjonsnummer
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="orgNr"
                                defaultValue={data.orgNr}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="9 siffer"
                                maxLength={9}
                            />
                            <button
                                type="button"
                                onClick={handleFetchBrreg}
                                disabled={isValidatingOrg}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm whitespace-nowrap"
                            >
                                {isValidatingOrg ? 'Henter...' : 'Hent info'}
                            </button>
                        </div>

                        {brregMessage && (
                            <p className="text-sm text-red-600 mt-2">{brregMessage}</p>
                        )}

                        {fetchedRoles && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                                <h4 className="font-semibold text-blue-900 mb-2">Registrert i Brønnøysundregistrene:</h4>
                                <ul className="space-y-1 text-blue-800">
                                    {fetchedRoles.dagligLeder && (
                                        <li className="flex gap-2">
                                            <span className="font-medium w-24">Daglig leder:</span>
                                            <span>
                                                {fetchedRoles.dagligLeder.person
                                                    ? `${fetchedRoles.dagligLeder.person.navn.fornavn} ${fetchedRoles.dagligLeder.person.navn.etternavn}`
                                                    : fetchedRoles.dagligLeder.enhet?.navn || 'Ukjent'}
                                            </span>
                                        </li>
                                    )}
                                    {fetchedRoles.styretsLeder && (
                                        <li className="flex gap-2">
                                            <span className="font-medium w-24">Styreleder:</span>
                                            <span>
                                                {fetchedRoles.styretsLeder.person
                                                    ? `${fetchedRoles.styretsLeder.person.navn.fornavn} ${fetchedRoles.styretsLeder.person.navn.etternavn}`
                                                    : fetchedRoles.styretsLeder.enhet?.navn || 'Ukjent'}
                                            </span>
                                        </li>
                                    )}
                                </ul>
                                <p className="mt-2 text-xs text-blue-600 italic">
                                    Stemmer dette med deg eller en annen kontaktperson?
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type organisasjon *
                        </label>
                        <select
                            name="orgType"
                            defaultValue={data.orgType || 'idrett'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="idrett">Idrettslag</option>
                            <option value="kultur">Kulturforening (Kor, Korps, Teater)</option>
                            <option value="ffo">FFO / Interesseorganisasjon</option>
                            <option value="borettslag">Borettslag / Velforening</option>
                            <option value="annet">Annet</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 border-t pt-6 mt-2">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Kontaktperson</h3>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fullt navn *
                        </label>
                        <input
                            type="text"
                            name="contactName"
                            defaultValue={data.contactName}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-post *
                        </label>
                        <input
                            type="email"
                            name="contactEmail"
                            defaultValue={data.contactEmail}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            name="contactPhone"
                            defaultValue={data.contactPhone}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                        {isPending ? 'Lagrer...' : 'Neste steg →'}
                    </button>
                </div>
            </form>
        </div>
    )
}
