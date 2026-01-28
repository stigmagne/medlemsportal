'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createOrganization } from '@/app/actions/organizations'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'

export default function NewOrganizationPage() {
    const [name, setName] = useState('')
    const [orgNumber, setOrgNumber] = useState('')
    const [contactEmail, setContactEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const result = await createOrganization({
            name,
            orgNumber: orgNumber || undefined,
            contactEmail: contactEmail || undefined,
        })

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        if (result.redirectTo) {
            router.push(result.redirectTo)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <div className="max-w-lg mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Tilbake til forsiden
                </Link>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Opprett ny organisasjon
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Kom i gang med Din Forening
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Navn på organisasjon *
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                placeholder="F.eks. Bakken Velforening"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="orgNumber"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Organisasjonsnummer (valgfritt)
                            </label>
                            <input
                                id="orgNumber"
                                type="text"
                                value={orgNumber}
                                onChange={(e) => setOrgNumber(e.target.value)}
                                pattern="[0-9]{9}"
                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                placeholder="9 siffer fra Brønnøysund"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Kreves for å motta betalinger via Stripe
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="contactEmail"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Kontakt-epost (valgfritt)
                            </label>
                            <input
                                id="contactEmail"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                placeholder="styret@forening.no"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Brukes som avsender for e-post til medlemmer
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Oppretter...
                                </>
                            ) : (
                                'Opprett og fortsett'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-xs text-center text-slate-500 dark:text-slate-400">
                        Etter opprettelse blir du guidet gjennom oppsett av organisasjonen din.
                    </p>
                </div>
            </div>
        </div>
    )
}
