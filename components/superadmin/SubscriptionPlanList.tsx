'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from '@/app/superadmin/settings/plans/actions'

type Plan = {
    id: string
    name: string
    price: number
    description: string | null
}

export default function SubscriptionPlanList({ initialPlans }: { initialPlans: Plan[] }) {
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pris (NOK)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Beskrivelse</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Handling</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {initialPlans.map(plan => (
                            <tr key={plan.id}>
                                {editingId === plan.id ? (
                                    <PlanForm
                                        plan={plan}
                                        onCancel={() => setEditingId(null)}
                                        onSubmit={async (formData) => {
                                            const res = await updateSubscriptionPlan(plan.id, formData)
                                            if (res.error) {
                                                alert(res.error)
                                            } else {
                                                setEditingId(null)
                                                router.refresh()
                                            }
                                        }}
                                    />
                                ) : (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{plan.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{plan.price},-</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{plan.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setEditingId(plan.id)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Rediger
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Er du sikker på at du vil slette denne planen?')) {
                                                        const res = await deleteSubscriptionPlan(plan.id)
                                                        if (res.error) {
                                                            alert(res.error)
                                                        } else {
                                                            router.refresh()
                                                        }
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Slett
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {isCreating && (
                            <tr>
                                <PlanForm
                                    onCancel={() => setIsCreating(false)}
                                    onSubmit={async (formData) => {
                                        const res = await createSubscriptionPlan(formData)
                                        if (res.error) {
                                            alert(res.error)
                                        } else {
                                            setIsCreating(false)
                                            router.refresh()
                                        }
                                    }}
                                />
                            </tr>
                        )}
                    </tbody>
                </table>
                {!isCreating && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Legg til ny plan
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function PlanForm({ plan, onCancel, onSubmit }: { plan?: Plan, onCancel: () => void, onSubmit: (d: FormData) => void }) {
    return (
        <>
            <td className="px-6 py-4">
                <input
                    name="name"
                    defaultValue={plan?.name}
                    placeholder="Plan navn"
                    className="w-full px-2 py-1 border rounded text-sm"
                    autoFocus
                    required
                />
            </td>
            <td className="px-6 py-4 w-32">
                <input
                    name="price"
                    type="text"
                    defaultValue={plan?.price || 0}
                    className="w-full px-2 py-1 border rounded text-sm"
                    required
                />
            </td>
            <td className="px-6 py-4">
                <input
                    name="description"
                    defaultValue={plan?.description || ''}
                    placeholder="Beskrivelse"
                    className="w-full px-2 py-1 border rounded text-sm"
                />
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            // find form and submit logic or just wrap in form
                            const row = (e.target as HTMLElement).closest('tr')
                            const inputs = row?.querySelectorAll('input')
                            if (inputs) {
                                const fd = new FormData()
                                inputs.forEach(i => fd.append(i.name, i.value))
                                onSubmit(fd)
                            }
                        }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                        Lagre
                    </button>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                        Avbryt
                    </button>
                </div>
            </td>
        </>
    )
}
