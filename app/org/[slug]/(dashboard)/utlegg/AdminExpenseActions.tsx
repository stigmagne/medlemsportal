'use client'

import { updateExpenseStatus } from '@/app/actions/expenses'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, X, CreditCard } from 'lucide-react'

export default function AdminExpenseActions({ expense }: { expense: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleStatusUpdate = async (status: 'approved' | 'rejected' | 'paid') => {
        if (!confirm(`Er du sikker på at du vil sette status til ${status}?`)) return

        setLoading(true)
        const res = await updateExpenseStatus(expense.id, status)

        if (res.error) {
            alert(res.error)
        } else {
            router.refresh()
        }
        setLoading(false)
    }

    if (expense.status === 'paid') return null
    if (expense.status === 'rejected') return null

    return (
        <div className="flex justify-end gap-1">
            {expense.status === 'submitted' && (
                <>
                    <button
                        onClick={() => handleStatusUpdate('approved')}
                        disabled={loading}
                        className="p-1 rounded hover:bg-green-100 text-green-600"
                        title="Godkjenn"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={loading}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                        title="Avvis"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </>
            )}

            {expense.status === 'approved' && (
                <button
                    onClick={() => handleStatusUpdate('paid')}
                    disabled={loading}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium"
                >
                    <CreditCard className="h-3 w-3" />
                    Marker betalt
                </button>
            )}
        </div>
    )
}
