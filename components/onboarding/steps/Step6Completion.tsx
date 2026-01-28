'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/actions/onboarding'
import {
    CheckCircle,
    CreditCard,
    Users,
    Tag,
    Mail,
    ArrowRight,
    ExternalLink,
    Loader2,
    AlertTriangle,
    Sparkles
} from 'lucide-react'

type Props = {
    orgSlug: string
    orgId: string
    orgName: string
    data: any
    hasStripeAccount: boolean
    stripeChargesEnabled: boolean
}

export default function Step6Completion({
    orgSlug,
    orgId,
    orgName,
    data,
    hasStripeAccount,
    stripeChargesEnabled
}: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [stripeLoading, setStripeLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleComplete = async () => {
        setLoading(true)
        await completeOnboarding(orgSlug)
        router.push(`/org/${orgSlug}/dashboard`)
    }

    const handleStripeSetup = async () => {
        setStripeLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/onboarding/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Kunne ikke starte Stripe-oppsett')
                setStripeLoading(false)
                return
            }

            if (data.onboardingUrl) {
                window.location.href = data.onboardingUrl
            }
        } catch (err) {
            setError('En feil oppstod. Prøv igjen.')
            setStripeLoading(false)
        }
    }

    // Calculate what was set up
    const categoriesCount = data?.categories?.length || 0
    const boardMembersCount = data?.boardMembersCreated || 0

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {orgName} er nesten klar!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Her er en oppsummering av hva som er satt opp.
                </p>
            </div>

            {/* Summary of what was configured */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Dette er konfigurert:
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Organisasjonsinformasjon</span>
                    </div>
                    {categoriesCount > 0 && (
                        <div className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                                {categoriesCount} medlemskategori{categoriesCount !== 1 ? 'er' : ''}
                            </span>
                        </div>
                    )}
                    {boardMembersCount > 0 && (
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                                {boardMembersCount} styremedlem{boardMembersCount !== 1 ? 'mer' : ''}
                            </span>
                        </div>
                    )}
                    {data?.emailTemplate && (
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">Velkomst-e-post konfigurert</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stripe Section */}
            <div className={`border rounded-lg p-6 mb-6 ${
                stripeChargesEnabled
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        stripeChargesEnabled
                            ? 'bg-green-200 dark:bg-green-800'
                            : 'bg-amber-200 dark:bg-amber-800'
                    }`}>
                        <CreditCard className={`w-5 h-5 ${
                            stripeChargesEnabled
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-amber-700 dark:text-amber-300'
                        }`} />
                    </div>
                    <div className="flex-1">
                        {stripeChargesEnabled ? (
                            <>
                                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                                    Betalinger aktivert
                                </h3>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Organisasjonen kan nå motta betalinger via Stripe.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                                        {hasStripeAccount ? 'Fullfør Stripe-verifisering' : 'Sett opp betalinger'}
                                    </h3>
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                                    {hasStripeAccount
                                        ? 'Stripe-kontoen er opprettet, men verifiseringen er ikke fullført.'
                                        : 'For å motta medlemskontingent og betalinger må dere koble til Stripe.'
                                    }
                                </p>
                                <button
                                    onClick={handleStripeSetup}
                                    disabled={stripeLoading}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {stripeLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ExternalLink className="w-4 h-4" />
                                    )}
                                    {hasStripeAccount ? 'Fullfør verifisering' : 'Konfigurer Stripe nå'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                    Neste steg:
                </h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Legg til flere medlemmer under «Medlemmer»</span>
                    </li>
                    {!stripeChargesEnabled && (
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Sett opp Stripe under «Innstillinger» → «Betaling»</span>
                        </li>
                    )}
                    <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Opprett ditt første arrangement</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Send ut velkomst-e-post til medlemmene</span>
                    </li>
                </ul>
            </div>

            {/* Complete button */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => router.push('/onboarding/5')}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800"
                >
                    ← Tilbake
                </button>
                <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Fullfører...
                        </>
                    ) : (
                        <>
                            Gå til Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
