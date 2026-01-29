'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    CreditCard,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
    Loader2,
    RefreshCw,
    Shield,
    Building2,
    Banknote
} from 'lucide-react'

type Props = {
    orgId: string
    orgName: string
    orgSlug: string
    hasStripeAccount: boolean
    stripeChargesEnabled: boolean
    stripePayoutsEnabled: boolean
    stripeOnboardingCompleted: boolean
    showSuccessMessage: boolean
    shouldRefreshStatus: boolean
}

export default function PaymentSettingsClient({
    orgId,
    orgName,
    orgSlug,
    hasStripeAccount,
    stripeChargesEnabled: initialChargesEnabled,
    stripePayoutsEnabled: initialPayoutsEnabled,
    stripeOnboardingCompleted: initialOnboardingCompleted,
    showSuccessMessage,
    shouldRefreshStatus
}: Props) {
    const [loading, setLoading] = useState(false)
    const [statusLoading, setStatusLoading] = useState(shouldRefreshStatus)
    const [error, setError] = useState<string | null>(null)
    const [chargesEnabled, setChargesEnabled] = useState(initialChargesEnabled)
    const [payoutsEnabled, setPayoutsEnabled] = useState(initialPayoutsEnabled)
    const [onboardingCompleted, setOnboardingCompleted] = useState(initialOnboardingCompleted)

    // Refresh status on mount if needed
    useEffect(() => {
        if (shouldRefreshStatus || showSuccessMessage) {
            refreshStatus()
        }
    }, [])

    const refreshStatus = async () => {
        setStatusLoading(true)
        try {
            const res = await fetch(`/api/onboarding/status?organizationId=${orgId}`)
            const data = await res.json()

            if (res.ok) {
                setChargesEnabled(data.chargesEnabled)
                setPayoutsEnabled(data.payoutsEnabled)
                setOnboardingCompleted(data.onboardingCompleted)
            }
        } catch (err) {
            console.error('Failed to refresh status:', err)
        } finally {
            setStatusLoading(false)
        }
    }

    const handleStripeSetup = async () => {
        setLoading(true)
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
                setLoading(false)
                return
            }

            if (data.onboardingUrl) {
                window.location.href = data.onboardingUrl
            }
        } catch (err) {
            setError('En feil oppstod. Prøv igjen.')
            setLoading(false)
        }
    }

    const isFullySetup = chargesEnabled && payoutsEnabled

    return (
        <div className="space-y-6">
            {showSuccessMessage && chargesEnabled && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <p className="text-green-800 dark:text-green-200 font-medium">
                            Stripe-oppsettet er fullført! Organisasjonen kan nå motta betalinger.
                        </p>
                    </div>
                </div>
            )}

            {/* Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isFullySetup
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : 'bg-amber-100 dark:bg-amber-900/30'
                            }`}>
                                <CreditCard className={`w-5 h-5 ${
                                    isFullySetup
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                }`} />
                            </div>
                            <div>
                                <CardTitle>Stripe-konto</CardTitle>
                                <CardDescription>
                                    {isFullySetup
                                        ? 'Betalinger er aktivert'
                                        : hasStripeAccount
                                            ? 'Krever handling'
                                            : 'Ikke konfigurert'
                                    }
                                </CardDescription>
                            </div>
                        </div>
                        <button
                            onClick={refreshStatus}
                            disabled={statusLoading}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Oppdater status"
                        >
                            <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status indicators */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${
                            hasStripeAccount
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                            <Building2 className={`w-4 h-4 ${
                                hasStripeAccount ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <div className="text-sm">
                                <p className="font-medium">Konto opprettet</p>
                                <p className={`text-xs ${
                                    hasStripeAccount ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                    {hasStripeAccount ? 'Ja' : 'Nei'}
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-2 p-3 rounded-lg ${
                            chargesEnabled
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                            <CreditCard className={`w-4 h-4 ${
                                chargesEnabled ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <div className="text-sm">
                                <p className="font-medium">Kan motta betaling</p>
                                <p className={`text-xs ${
                                    chargesEnabled ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                    {chargesEnabled ? 'Ja' : 'Nei'}
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-2 p-3 rounded-lg ${
                            payoutsEnabled
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                            <Banknote className={`w-4 h-4 ${
                                payoutsEnabled ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <div className="text-sm">
                                <p className="font-medium">Utbetalinger</p>
                                <p className={`text-xs ${
                                    payoutsEnabled ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                    {payoutsEnabled ? 'Aktivert' : 'Ikke aktivert'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action section */}
                    {!isFullySetup && (
                        <div className={`p-4 rounded-lg ${
                            hasStripeAccount
                                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        }`}>
                            <div className="flex items-start gap-3">
                                {hasStripeAccount ? (
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <h4 className={`font-medium mb-1 ${
                                        hasStripeAccount
                                            ? 'text-amber-800 dark:text-amber-200'
                                            : 'text-blue-800 dark:text-blue-200'
                                    }`}>
                                        {hasStripeAccount
                                            ? 'Fullfør Stripe-verifisering'
                                            : 'Koble til Stripe'
                                        }
                                    </h4>
                                    <p className={`text-sm mb-3 ${
                                        hasStripeAccount
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-blue-700 dark:text-blue-300'
                                    }`}>
                                        {hasStripeAccount
                                            ? 'Stripe-kontoen er opprettet, men verifiseringen er ikke fullført. Du må fullføre verifiseringen for å kunne motta betalinger.'
                                            : 'For å motta medlemskontingent og betalinger fra arrangementer må organisasjonen kobles til Stripe.'
                                        }
                                    </p>
                                    <button
                                        onClick={handleStripeSetup}
                                        disabled={loading}
                                        className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50 ${
                                            hasStripeAccount
                                                ? 'bg-amber-600 hover:bg-amber-700'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Starter...
                                            </>
                                        ) : (
                                            <>
                                                <ExternalLink className="w-4 h-4" />
                                                {hasStripeAccount ? 'Fullfør verifisering' : 'Start Stripe-oppsett'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Om Stripe
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        Stripe er en av verdens mest pålitelige betalingsløsninger. De håndterer alle betalinger
                        sikkert og i tråd med PCI-DSS-standarder.
                    </p>
                    <p>
                        <strong>Viktig:</strong> For å verifisere kontoen trenger du:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Organisasjonsnummer fra Brønnøysund</li>
                        <li>Bankkonto for utbetalinger</li>
                        <li>Legitimasjon (BankID eller pass)</li>
                        <li>Signaturrett i organisasjonen</li>
                    </ul>
                    <p className="text-xs text-gray-500 pt-2">
                        Vi lagrer aldri kortnummer eller bankdetaljer direkte - alt håndteres av Stripe.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
