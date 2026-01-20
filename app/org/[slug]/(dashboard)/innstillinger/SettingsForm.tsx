'use client'

import { updateMembershipFee } from '@/app/actions/settings'
import { useState } from 'react'

export default function SettingsForm({ orgId, initialFee }: { orgId: string, initialFee: number }) {
    const [fee, setFee] = useState(initialFee)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await updateMembershipFee(orgId, Number(fee))
        if (res.error) alert(res.error)
        else alert('Innstillinger lagret')
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Årlig Medlemskontingent (kr)
                </label>
                <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Lagrer...' : 'Lagre Endringer'}
            </button>
        </form>
    )
}
