'use client'

import { updateOrganizationSettings } from '@/app/actions/settings'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsForm({ orgId, initialFee, initialAccountNumber }: { orgId: string, initialFee: number, initialAccountNumber?: string }) {
    const [fee, setFee] = useState(initialFee)
    const [accountNumber, setAccountNumber] = useState(initialAccountNumber || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await updateOrganizationSettings(orgId, {
            membershipFee: Number(fee),
            accountNumber: accountNumber
        })
        if (res.error) alert(res.error)
        else alert('Innstillinger lagret')
        setLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generelle Innstillinger</CardTitle>
                <CardDescription>Standardverdier for foreningen</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <p className="text-xs text-gray-500 mt-1">Standardpris hvis ingen medlemstype er valgt.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kontonummer for Faktura
                        </label>
                        <input
                            type="text"
                            value={accountNumber}
                            placeholder="1234.56.78903"
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">Nødvendig for å kunne tilby faktura med KID.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Lagrer...' : 'Lagre Endringer'}
                    </button>
                </form>
            </CardContent>
        </Card>
    )
}
