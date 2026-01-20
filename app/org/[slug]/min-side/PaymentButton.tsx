'use client'

import { useState } from 'react'
import { initiateMembershipPayment } from '../(dashboard)/contingent/payment-actions'
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
            const res = await initiateMembershipPayment(orgId, feeId, memberId)

            if (res.error) {
                alert(t('errorPrefix') + res.error)
                setLoading(false)
            } else if (res.url) {
                // Redirect to Vipps
                window.location.href = res.url
            }
        } catch (e) {
            console.error(e)
            alert(t('unexpectedError'))
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF5B24] hover:bg-[#E04815] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5B24] disabled:opacity-50 transition-colors"
        >
            {loading ? tCommon('loading') : t('payWithVipps', { amount })}
        </button>
    )
}
