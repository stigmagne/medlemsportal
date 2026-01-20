'use client'

import { ImportState } from '../ImportWizard'

type Props = {
    state: ImportState
    setState: (state: ImportState) => void
    onNext: () => void
    onBack: () => void
    org_id: string
    slug: string
}

export default function PreviewStep({ state, onNext, onBack }: Props) {
    const previewData = state.data.slice(0, 5) // Show first 5 rows
    const mappedFields = Object.entries(state.mapping)

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Se over dataene
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Her ser du en forhåndsvisning av hvordan de første 5 radene blir importert.
                    Antall rader totalt: <strong>{state.data.length}</strong>
                </p>
            </div>

            <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            {mappedFields.map(([key, _]) => {
                                // Translate keys to readable labels
                                const labels: Record<string, string> = {
                                    first_name: 'Fornavn',
                                    last_name: 'Etternavn',
                                    email: 'E-post',
                                    phone: 'Telefon',
                                    address: 'Adresse',
                                    postal_code: 'Postnr',
                                    city: 'Poststed',
                                    date_of_birth: 'Fødselsdato',
                                    member_number: 'Medlemnr',
                                    joined_date: 'Innmeldt'
                                }
                                return (
                                    <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {labels[key] || key}
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {previewData.map((row, idx) => (
                            <tr key={idx}>
                                {mappedFields.map(([key, header]) => (
                                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {row[header] || <span className="text-gray-400 italic font-light">Tomt</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-4 text-sm text-blue-700 dark:text-blue-300">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                    <p className="font-medium">Viktig informasjon:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>Rader uten <strong>Fornavn</strong> og <strong>Etternavn</strong> blir hoppet over.</li>
                        <li>Medlemmer med e-postadresse som allerede finnes i registeret blir hoppet over (duplikater).</li>
                        <li>Datoer bør være på formatet ÅÅÅÅ-MM-DD for best resultat.</li>
                    </ul>
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
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                    Start Import →
                </button>
            </div>
        </div>
    )
}
