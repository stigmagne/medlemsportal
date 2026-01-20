'use client'

import { updateOnboardingStep, type OnboardingData } from '../actions'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type MemberInput = {
    name: string
    email: string
    role: 'board' | 'member'
}

export default function Step4Import({
    data,
    orgId
}: {
    data: OnboardingData
    orgId: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [members, setMembers] = useState<MemberInput[]>([
        { name: '', email: '', role: 'board' },
        { name: '', email: '', role: 'board' },
        { name: '', email: '', role: 'member' }
    ])

    const handleUpdate = (index: number, field: keyof MemberInput, value: string) => {
        const newMembers = [...members]
        // @ts-ignore
        newMembers[index][field] = value
        setMembers(newMembers)
    }

    const handleAddRow = () => {
        setMembers([...members, { name: '', email: '', role: 'member' }])
    }

    const handleSkip = () => {
        startTransition(async () => {
            // Save empty or existing
            await updateOnboardingStep(orgId, 4, {})
            router.push('/onboarding/5')
        })
    }

    const handleSubmit = async () => {
        // Filter out empty rows
        const validMembers = members.filter(m => m.name.trim() && m.email.trim())

        // In a real app we would create these users/members here via another server action
        // For this onboarding demo, we will just simulate "Imported count"

        startTransition(async () => {
            const res = await updateOnboardingStep(orgId, 4, {
                importedCount: validMembers.length
                // In reality we would pass the actual member list to be processed
            })

            if (res.success) {
                router.push(`/onboarding/${res.nextStep}`)
            }
        })
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Legg til medlemmer</h2>
                    <p className="text-gray-500 text-sm">
                        Start med å legge til styret eller nøkkelpersoner. <br />
                        Større medlemslister kan du importere via CSV senere i dashbordet.
                    </p>
                </div>
                <div className="bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                    Valgfritt
                </div>
            </div>

            <div className="space-y-4 mb-8">
                {members.map((member, index) => (
                    <div key={index} className="flex gap-4 items-start">
                        <div className="flex-1">
                            {index === 0 && <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Navn</label>}
                            <input
                                type="text"
                                value={member.name}
                                onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                                placeholder="Ola Nordmann"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            {index === 0 && <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">E-post</label>}
                            <input
                                type="email"
                                value={member.email}
                                onChange={(e) => handleUpdate(index, 'email', e.target.value)}
                                placeholder="ola@eksempel.no"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="w-40">
                            {index === 0 && <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rolle</label>}
                            <select
                                value={member.role}
                                onChange={(e) => handleUpdate(index, 'role', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            >
                                <option value="board">Styremedlem</option>
                                <option value="member">Medlem</option>
                            </select>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 text-sm mt-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Legg til en rad til
                </button>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
                <button
                    onClick={handleSkip}
                    disabled={isPending}
                    className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm font-medium"
                >
                    Hopp over
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                    {isPending ? 'Lagrer...' : 'Neste steg →'}
                </button>
            </div>
        </div>
    )
}
