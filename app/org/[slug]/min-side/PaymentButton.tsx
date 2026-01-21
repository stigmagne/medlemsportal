'use client'

import { useState } from 'react'
// import { initiateMembershipPayment } from '../(dashboard)/contingent/payment-actions'
import { useTranslations } from 'next-intl'

export default function PaymentButton({
    orgId,
    feeId,
    memberId,
    amount
}: {
    orgId: string
    feeId: string
    memberId: string
    amount: number
}) {
    const [loading, setLoading] = useState(false)
    const t = useTranslations('Payment')
    const tCommon = useTranslations('Common')

    const handlePayment = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: orgId,
                    amount: amount, // API expects NOK amount
                    memberId: memberId,
                    paymentType: 'membership_fee',
                    description: `Kontingent for ${feeId}`
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Betaling feilet')
            }

            // TODO: Handle Stripe Client Secret / Elements
            // For now, alerts success of initiation to unblock build.
            // A full Stripe Elements integration requires a wrapping <Elements> provider.
            // Since this is a "quick fix" for build, I will log the intent.
            console.log('Payment Initiated:', data)
            alert('Betaling startet (Stripe integrasjon kommer i neste steg).')

        } catch (e: any) {
            console.error(e)
            alert(e.message || t('unexpectedError'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF5B24] hover:bg-[#E04815] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5B24] disabled:opacity-50 transition-colors"
        >
            {loading ? tCommon('loading') : `Betal ${amount},-`}
        </button>
    )
}
