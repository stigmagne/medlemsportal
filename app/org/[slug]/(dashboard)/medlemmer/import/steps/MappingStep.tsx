'use client'

import { useEffect } from 'react'
import { ImportState } from '../ImportWizard'

type Props = {
    state: ImportState
    setState: (state: ImportState) => void
    onNext: () => void
    onBack: () => void
    org_id: string
    slug: string
}

const REQUIRED_FIELDS = [
    { key: 'first_name', label: 'Fornavn', required: true },
    { key: 'last_name', label: 'Etternavn', required: true },
    { key: 'email', label: 'E-post', required: false },
    { key: 'phone', label: 'Telefon', required: false },
    { key: 'address', label: 'Adresse', required: false },
    { key: 'postal_code', label: 'Postnummer', required: false },
    { key: 'city', label: 'Poststed', required: false },
    { key: 'date_of_birth', label: 'Fødselsdato', required: false },
    { key: 'member_number', label: 'Medlemsnummer', required: false, help: 'La stå tom for automatisk nummerering' },
    { key: 'joined_date', label: 'Innmeldingsdato', required: false },
]

export default function MappingStep({ state, setState, onNext, onBack }: Props) {
    // Smart guessing of mappings on first load
    useEffect(() => {
        if (Object.keys(state.mapping).length === 0) {
            const newMapping: Record<string, string> = {}

            state.headers.forEach(header => {
                const h = header.toLowerCase()

                if (h.includes('fornavn') || h.includes('first')) newMapping['first_name'] = header
                else if (h.includes('etternavn') || h.includes('slektsnavn') || h.includes('last')) newMapping['last_name'] = header
                else if (h.includes('epost') || h.includes('mail') || h.includes('e-post')) newMapping['email'] = header
                else if (h.includes('telefon') || h.includes('mobil') || h.includes('phone')) newMapping['phone'] = header
                else if (h.includes('adresse') || h.includes('address') || h.includes('gate')) newMapping['address'] = header
                else if (h.includes('postnummer') || h.includes('zip')) newMapping['postal_code'] = header
                else if (h.includes('sted') || h.includes('by') || h.includes('city')) newMapping['city'] = header
                else if (h.includes('fødsel') || h.includes('birth')) newMapping['date_of_birth'] = header
                else if (h.includes('nummer') || h.includes('nr') || h.includes('id')) newMapping['member_number'] = header
                else if (h.includes('innmeldt') || h.includes('dato') || h.includes('joined')) newMapping['joined_date'] = header
            })

            // Only update if we found reasonable guesses to avoid overriding user manual input if they came back
            if (Object.keys(newMapping).length > 0) {
                setState({ ...state, mapping: newMapping })
            }
        }
    }, [])

    const handleMappingChange = (fieldKey: string, header: string) => {
        const newMapping = { ...state.mapping }
        if (header) {
            newMapping[fieldKey] = header
        } else {
            delete newMapping[fieldKey]
        }
        setState({ ...state, mapping: newMapping })
    }

    const isValid = () => {
        return REQUIRED_FIELDS.filter(f => f.required).every(f => state.mapping[f.key])
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Koble kolonner
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Velg hvilken kolonne i din CSV-fil som tilsvarer feltene i systemet.
                </p>
            </div>

            <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {REQUIRED_FIELDS.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <select
                                value={state.mapping[field.key] || ''}
                                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                className={`block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white py-2 px-3 ${field.required && !state.mapping[field.key] ? 'border-red-300 dark:border-red-800 ring-1 ring-red-200' : ''
                                    }`}
                            >
                                <option value="">Velg kolonne...</option>
                                {state.headers.map((header) => (
                                    <option key={header} value={header}>
                                        {header} (eksempel: {state.data[0][header]})
                                    </option>
                                ))}
                            </select>
                            {field.help && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{field.help}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    ← Tilbake
                </button>
                <button
                    onClick={onNext}
                    disabled={!isValid()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                >
                    Neste: Se over →
                </button>
            </div>
        </div>
    )
}
