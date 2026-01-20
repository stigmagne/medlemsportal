'use client'

import { useState, useTransition } from 'react'
import { updateOrganizationSubscription } from '@/app/superadmin/organizations/[id]/actions'

interface SubscriptionManagerProps {
    orgId: string
    initialData: {
        subscription_plan?: string
        subscription_status?: string
        subscription_balance?: number
        subscription_year?: number
        subscription_expiry?: string
    }
    availablePlans: {
        id: string
        name: string
        price: number
    }[]
}

export default function SubscriptionManager({ orgId, initialData, availablePlans }: SubscriptionManagerProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Form state
    const [plan, setPlan] = useState(initialData.subscription_plan || availablePlans[0]?.name || 'Årsabonnement')
    const [status, setStatus] = useState(initialData.subscription_status || 'active')
    const [balance, setBalance] = useState(initialData.subscription_balance?.toString() || '990')
    const [year, setYear] = useState(initialData.subscription_year?.toString() || new Date().getFullYear().toString())

    const handleSave = async () => {
        startTransition(async () => {
            const res = await updateOrganizationSubscription(orgId, {
                plan,
                status,
                balance: parseFloat(balance),
                year: parseInt(year)
            })

            if (res.success) {
                setIsEditing(false)
            } else {
                alert('Feil ved lagring: ' + (res.error || 'Ukjent feil'))
            }
        })
    }

    // When changing plan, auto-update balance if it matches a known plan price
    const handlePlanChange = (newPlanName: string) => {
        setPlan(newPlanName)
        const found = availablePlans.find(p => p.name === newPlanName)
        if (found) {
            setBalance(found.price.toString())
        }
    }

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rediger abonnement
                    </h3>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Avbryt
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                        <select
                            value={plan}
                            onChange={(e) => handlePlanChange(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {availablePlans.map(p => (
                                <option key={p.id} value={p.name}>
                                    {p.name} ({p.price},-)
                                </option>
                            ))}
                            <option value="custom">Annet / Egendefinert</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="active">Aktiv</option>
                                <option value="pending">Avventer</option>
                                <option value="expired">Utløpt</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gjelder år</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Gjenstående beløp (NOK)
                        </label>
                        <input
                            type="number"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Sett til 0 når betalt.</p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isPending ? 'Lagrer...' : 'Lagre endringer'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Abonnement
                </h3>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                    Rediger
                </button>
            </div>

            <dl className="space-y-4">
                <div>
                    <dt className="font-medium text-gray-500 text-xs uppercase">Type</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {plan}
                    </dd>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <dt className="font-medium text-gray-500 text-xs uppercase">Status</dt>
                        <dd className="mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${status === 'active' ? 'bg-green-100 text-green-800' :
                                status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {status === 'active' ? 'Aktiv' :
                                    status === 'pending' ? 'Avventer' : 'Utløpt'}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500 text-xs uppercase">År</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {year}
                        </dd>
                    </div>
                </div>

                <div>
                    <dt className="font-medium text-gray-500 text-xs uppercase">Saldo (gjenstående)</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                        kr {balance},-
                    </dd>
                    {parseFloat(balance) > 0 ? (
                        <p className="text-xs text-red-500 mt-1">Ikke betalt</p>
                    ) : (
                        <p className="text-xs text-green-500 mt-1">Betalt</p>
                    )}
                </div>
            </dl>
        </div>
    )
}
