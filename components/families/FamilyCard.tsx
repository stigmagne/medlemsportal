'use client'

import { useState } from 'react'
import { updateFamily, deleteFamily, removeMemberFromFamily } from '@/app/actions/families'

interface Member {
    id: string
    first_name: string
    last_name: string
    email: string
    fee?: number
    status?: string
}

interface Family {
    id: string
    family_name: string
    payer_member_id: string
    payer: Member
    family_members: Member[]
}

export default function FamilyCard({ family, orgSlug }: { family: Family, orgSlug: string }) {
    const [isEditing, setIsEditing] = useState(false)

    const totalFee = family.family_members.reduce((sum, m) => sum + (m.fee || 0), 0)

    const handleDelete = async () => {
        if (confirm('Er du sikker på at du vil slette denne familien? Medlemmene vil bli stående som enkeltmedlemmer.')) {
            await deleteFamily(family.id, orgSlug)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (confirm('Er du sikker på at du vil fjerne dette medlemmet fra familien?')) {
            const res = await removeMemberFromFamily(memberId, orgSlug)
            if (res?.error) alert(res.error)
            if (res?.message) alert(res.message)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {family.family_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Betaler: {family.payer.first_name} {family.payer.last_name} ({family.payer.email})
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Edit button placeholder - for simplicity we just have delete for now */}
                    <button
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                        Oppløs familie
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Medlemmer ({family.family_members.length})
                </h4>
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {family.family_members.map(member => (
                        <li key={member.id} className="py-2 flex justify-between items-center text-sm">
                            <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {member.first_name} {member.last_name}
                                </span>
                                <span className="ml-2 text-gray-500 dark:text-gray-400">
                                    {member.id === family.payer_member_id ? '(Betaler)' : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-600 dark:text-gray-300">
                                    {member.fee || 0} kr
                                </span>
                                {member.id !== family.payer_member_id && (
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-gray-400 hover:text-red-600"
                                        title="Fjern fra familie"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total årskontingent</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {totalFee} kr
                </span>
            </div>
        </div>
    )
}
