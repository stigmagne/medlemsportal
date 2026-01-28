'use client'

import { useState } from 'react'
import { MembershipFee, createMembershipFee, toggleFeeStatus } from '../actions'

export default function FeeSettings({ fees, orgSlug }: { fees: MembershipFee[], orgSlug: string }) {
    const [isCreating, setIsCreating] = useState(false)
    const [newItem, setNewItem] = useState({ name: '', amount: '', due_date: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const res = await createMembershipFee(orgSlug, {
            name: newItem.name,
            amount: parseFloat(newItem.amount),
            due_date: newItem.due_date || undefined
        })

        if (res.success) {
            setIsCreating(false)
            setNewItem({ name: '', amount: '', due_date: '' })
        } else {
            alert('Feil ved opprettelse: ' + res.error)
        }
        setLoading(false)
    }

    const handleToggle = async (fee: MembershipFee) => {
        await toggleFeeStatus(fee.id, !fee.is_active, orgSlug)
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tilgjengelige kontingenter</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                    + Ny kontingent
                </button>
            </div>

            {isCreating && (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Opprett ny kontingenttype</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Navn (f.eks. "Senior 2025")</label>
                            <input
                                type="text" required
                                value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Beløp (NOK)</label>
                            <input
                                type="number" required min="0" step="1"
                                value={newItem.amount} onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit" disabled={loading}
                                className="flex-1 bg-green-600 text-white rounded-md text-sm font-medium py-2 hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Lagrer...' : 'Lagre'}
                            </button>
                            <button
                                type="button" onClick={() => setIsCreating(false)}
                                className="px-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-300"
                            >
                                Avbryt
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {fees.length === 0 ? (
                        <li className="px-6 py-8 text-center text-sm text-gray-500">Ingen kontingenter definert ennå.</li>
                    ) : (
                        fees.map((fee) => (
                            <li key={fee.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h4 className={`text-sm font-medium ${fee.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-500 line-through'}`}>
                                        {fee.name}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        {fee.amount} kr {fee.due_date && `• Forfall: ${fee.due_date}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${fee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {fee.is_active ? 'Aktiv' : 'Arkivert'}
                                    </span>
                                    <button
                                        onClick={() => handleToggle(fee)}
                                        className="text-sm text-blue-600 hover:text-blue-500"
                                    >
                                        {fee.is_active ? 'Arkiver' : 'Aktiver'}
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    )
}
