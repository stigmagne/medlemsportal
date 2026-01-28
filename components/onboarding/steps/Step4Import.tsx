'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOnboardingProgress, createBoardMembers, skipOnboardingStep } from '@/app/actions/onboarding'
import { Users, Plus, Trash2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react'

type BoardMember = {
    firstName: string
    lastName: string
    email: string
    role: string
}

const defaultRoles = ['Leder', 'Nestleder', 'Kasserer', 'Sekretær', 'Styremedlem']

export default function Step4Import({ orgSlug, data }: { orgSlug: string, data: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<BoardMember[]>(data?.boardMembers || [
        { firstName: '', lastName: '', email: '', role: 'Leder' }
    ])
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const addMember = () => {
        setMembers([...members, { firstName: '', lastName: '', email: '', role: 'Styremedlem' }])
    }

    const removeMember = (index: number) => {
        if (members.length > 1) {
            setMembers(members.filter((_, i) => i !== index))
        }
    }

    const updateMember = (index: number, field: keyof BoardMember, value: string) => {
        const updated = [...members]
        updated[index] = { ...updated[index], [field]: value }
        setMembers(updated)
    }

    const handleNext = async () => {
        setLoading(true)
        setMessage(null)

        // Filter out members without required fields
        const validMembers = members.filter(m =>
            m.firstName?.trim() && m.lastName?.trim() && m.email?.trim()
        )

        if (validMembers.length > 0) {
            // Create board members in database
            const result = await createBoardMembers(orgSlug, validMembers)

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
                setLoading(false)
                return
            }

            // Save to onboarding progress
            await updateOnboardingProgress(orgSlug, 4, {
                boardMembers: validMembers,
                boardMembersCreated: result.created
            })
        } else {
            // Just skip if no valid members
            await skipOnboardingStep(orgSlug, 4)
        }

        router.push('/onboarding/5')
    }

    const handleSkip = async () => {
        setLoading(true)
        await skipOnboardingStep(orgSlug, 4)
        router.push('/onboarding/5')
    }

    const validMemberCount = members.filter(m =>
        m.firstName?.trim() && m.lastName?.trim() && m.email?.trim()
    ).length

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                Legg til styremedlemmer
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Registrer styret i organisasjonen. Disse får tilgang til administrasjonspanelet.
                Du kan legge til flere medlemmer senere.
            </p>

            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            <div className="space-y-4 mb-6">
                {members.map((member, i) => (
                    <div key={i} className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Person {i + 1}
                            </span>
                            {members.length > 1 && (
                                <button
                                    onClick={() => removeMember(i)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Fjern"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                value={member.firstName}
                                onChange={e => updateMember(i, 'firstName', e.target.value)}
                                placeholder="Fornavn *"
                                className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <input
                                value={member.lastName}
                                onChange={e => updateMember(i, 'lastName', e.target.value)}
                                placeholder="Etternavn *"
                                className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <input
                                type="email"
                                value={member.email}
                                onChange={e => updateMember(i, 'email', e.target.value)}
                                placeholder="E-post *"
                                className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <select
                                value={member.role}
                                onChange={e => updateMember(i, 'role', e.target.value)}
                                className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            >
                                {defaultRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addMember}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 w-full justify-center py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400"
                >
                    <UserPlus className="w-4 h-4" />
                    Legg til person
                </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Merk:</strong> Styremedlemmene blir opprettet som medlemmer i systemet.
                    De vil kunne logge inn med sin e-postadresse etter at de har satt passord.
                </p>
            </div>

            <div className="pt-6 flex justify-between">
                <button
                    onClick={() => router.push('/onboarding/3')}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800"
                >
                    ← Tilbake
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleSkip}
                        disabled={loading}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 px-4 py-2"
                    >
                        Hopp over
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            'Lagrer...'
                        ) : validMemberCount > 0 ? (
                            <>
                                <Plus className="w-4 h-4" />
                                Legg til {validMemberCount} {validMemberCount === 1 ? 'person' : 'personer'} →
                            </>
                        ) : (
                            'Neste →'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
