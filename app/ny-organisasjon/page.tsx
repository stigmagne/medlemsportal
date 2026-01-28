'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createOrganization } from '@/app/actions/organizations'
import { Building2, ArrowLeft, Loader2, Shield, AlertCircle } from 'lucide-react'

export default function NewOrganizationPage() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
    const [userEmail, setUserEmail] = useState('')

    // User fields (for new users)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Organization fields
    const [orgName, setOrgName] = useState('')
    const [orgNumber, setOrgNumber] = useState('')
    const [contactEmail, setContactEmail] = useState('')

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'form' | 'verify'>('form')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setIsLoggedIn(!!user)
            if (user?.email) {
                setUserEmail(user.email)
                setContactEmail(user.email)
            }
        }
        checkAuth()
    }, [supabase.auth])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // If not logged in, create user first
            if (!isLoggedIn) {
                // Validate password
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/
                if (!passwordRegex.test(password)) {
                    setError('Passordet må være minst 12 tegn og inneholde stor bokstav, liten bokstav og et tall')
                    setLoading(false)
                    return
                }

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: `${firstName} ${lastName}`,
                        },
                    },
                })

                if (signUpError) {
                    setError(signUpError.message)
                    setLoading(false)
                    return
                }

                if (data.user && !data.session) {
                    // Email confirmation required
                    setStep('verify')
                    setLoading(false)
                    return
                }
            }

            // Create organization
            const result = await createOrganization({
                name: orgName,
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
        } catch (err) {
            setError('En uventet feil oppstod. Prøv igjen.')
            setLoading(false)
        }
    }

    // Loading state while checking auth
    if (isLoggedIn === null) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // Email verification step
    if (step === 'verify') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Sjekk e-posten din
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Vi har sendt en bekreftelseslenke til <strong>{email}</strong>.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Klikk på lenken i e-posten for å aktivere kontoen din, deretter kan du logge inn og fullføre registreringen av organisasjonen.
                        </p>
                        <div className="mt-6">
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Gå til innlogging
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <div className="max-w-xl mx-auto">
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
                                Kom i gang med Din Forening
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Registrer din organisasjon gratis
                            </p>
                        </div>
                    </div>

                    {/* Important notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                        <div className="flex gap-3">
                            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                                    Viktig informasjon
                                </h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    For å motta betalinger må organisasjonen verifiseres hos Stripe.
                                    Den som registrerer bør være <strong>leder, nestleder eller kasserer</strong> med
                                    signaturrett, da Stripe krever verifisering av identitet og tilknytning til organisasjonen.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* User section - only show if not logged in */}
                        {!isLoggedIn && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                                    Din informasjon
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Fornavn *
                                        </label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                            placeholder="Ola"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Etternavn *
                                        </label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                            placeholder="Nordmann"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        E-post *
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (!contactEmail) setContactEmail(e.target.value)
                                        }}
                                        required
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                        placeholder="ola@example.no"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Passord *
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={12}
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                        placeholder="Minimum 12 tegn"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Minimum 12 tegn med stor bokstav, liten bokstav og tall
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Organization section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                                Om organisasjonen
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Navn på organisasjon *
                                </label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    required
                                    minLength={2}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                    placeholder="F.eks. Bakken Velforening"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Organisasjonsnummer
                                </label>
                                <input
                                    type="text"
                                    value={orgNumber}
                                    onChange={(e) => setOrgNumber(e.target.value)}
                                    pattern="[0-9]{9}"
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                                    placeholder="9 siffer fra Brønnøysundregistrene"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Kreves for å motta betalinger. Kan legges til senere.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Kontakt-epost for organisasjonen
                                </label>
                                <input
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
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !orgName.trim() || (!isLoggedIn && (!firstName || !lastName || !email || !password))}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {!isLoggedIn ? 'Oppretter konto...' : 'Oppretter organisasjon...'}
                                </>
                            ) : (
                                !isLoggedIn ? 'Opprett konto og organisasjon' : 'Opprett organisasjon'
                            )}
                        </button>
                    </form>

                    {!isLoggedIn && (
                        <p className="mt-6 text-sm text-center text-slate-500 dark:text-slate-400">
                            Har du allerede en konto?{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Logg inn
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
