'use client'

import { useState } from 'react'
// import { initiateMembershipPayment } from '../(dashboard)/contingent/payment-actions'
import { useTranslations } from 'next-intl'
import { FileText, CreditCard } from 'lucide-react'

export default function PaymentButton({
    orgId,
    feeId,
    memberId,
    amount,
    hasInvoiceOption = false
}: {
    orgId: string
    feeId: string
    memberId: string
    amount: number
    hasInvoiceOption?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [invoiceData, setInvoiceData] = useState<{ kid: string, accountNumber: string, amount: number } | null>(null)
    const t = useTranslations('Payment')
    const tCommon = useTranslations('Common')

    const handlePayment = async (method: 'stripe' | 'invoice') => {
        setLoading(true)
        try {
            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: orgId,
                    amount: amount,
                    memberId: memberId,
                    paymentType: 'membership_fee',
                    description: `Kontingent for ${feeId}`,
                    paymentMethod: method
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Betaling feilet')
            }

            if (method === 'invoice' && data.invoice) {
                setInvoiceData(data.invoice)
                return
            }

            if (method === 'stripe') {
                // TODO: Handle Stripe Client Secret / Elements
                console.log('Payment Initiated:', data)
                alert('Betaling startet (Stripe integrasjon kommer i neste steg).')
            }

        } catch (e: any) {
            console.error(e)
            alert(e.message || t('unexpectedError'))
        } finally {
            setLoading(false)
        }
    }

    if (invoiceData) {
        return (
            <div className="bg-white dark:bg-gray-800 border-2 border-green-500 rounded-lg p-4 max-w-sm">
                <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400 font-bold">
                    <FileText className="w-5 h-5" />
                    <span>Faktura opprettet</span>
                </div>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                        <span>Kontonummer:</span>
                        <span className="font-mono font-bold select-all">{invoiceData.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>KID:</span>
                        <span className="font-mono font-bold select-all">{invoiceData.kid}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                        <span>Beløp:</span>
                        <span className="font-bold">{invoiceData.amount},-</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                    Bruk nettbanken for å betale.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
                onClick={() => handlePayment('stripe')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#635BFF] hover:bg-[#5348E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF] disabled:opacity-50 transition-colors"
            >
                {loading ? tCommon('loading') : (
                    <>
                        <CreditCard className="w-4 h-4" />
                        <span>{`Betal ${amount},-`}</span>
                    </>
                )}
            </button>

            {hasInvoiceOption && (
                <button
                    onClick={() => handlePayment('invoice')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    <span>Få Faktura (KID)</span>
                </button>
            )}
        </div>
    )
}
