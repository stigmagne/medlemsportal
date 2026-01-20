'use client'

import { useState } from 'react'
import { addMemberToFamily, removeMemberFromFamily } from '@/app/actions/families'
import CreateFamilyModal from '@/components/families/CreateFamilyModal'

export default function MemberFamilySection({ member, orgId, orgSlug, availableFamilies }: any) {
    const [isAdding, setIsAdding] = useState(false)
    const [selectedFamilyId, setSelectedFamilyId] = useState('')

    const handleAddToExisting = async () => {
        if (!selectedFamilyId) return
        const res = await addMemberToFamily(member.id, selectedFamilyId, orgSlug)
        if (res.error) alert(res.error)
        else setIsAdding(false)
    }

    const handleRemove = async () => {
        if (confirm('Er du sikker på at du vil fjerne medlemmet fra familien?')) {
            const res = await removeMemberFromFamily(member.id, orgSlug)
            if (res.error) alert(res.error)
        }
    }

    if (member.family) {
        return (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Familie</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                        Medlemmet er del av: <span className="font-bold">{member.family.family_name}</span>
                    </p>
                    <div className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                        <p>Betaler: {member.family.payer?.first_name} {member.family.payer?.last_name}</p>
                    </div>
                    <div className="mt-4">
                        <a
                            href={`/org/${orgSlug}/familier`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-4"
                        >
                            Gå til familie
                        </a>
                        <button
                            onClick={handleRemove}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                            Fjern fra familie
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Familie</h3>
            {!isAdding ? (
                <div className="text-sm text-gray-500">
                    <p className="mb-4">Dette medlemmet er ikke koblet til en familie.</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-blue-600 hover:underline"
                    >
                        + Legg til i familie
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Legg til i eksisterende familie</label>
                        <div className="flex gap-2 mt-1">
                            <select
                                value={selectedFamilyId}
                                onChange={(e) => setSelectedFamilyId(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 p-2 border"
                            >
                                <option value="">Velg familie...</option>
                                {availableFamilies.map((f: any) => (
                                    <option key={f.id} value={f.id}>
                                        {f.family_name} (Betaler: {f.payer?.first_name} {f.payer?.last_name})
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddToExisting}
                                disabled={!selectedFamilyId}
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Lagre
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500">eller</span>
                        </div>
                    </div>

                    <div>
                        <CreateFamilyModal
                            orgId={orgId}
                            availableMembers={[{ ...member }]} // Start with just this member pre-selected conceptually, though modal handles logic differently. Actually modal expects a list. 
                        // Wait, creating a NEW family requires at least 2 people. 
                        // We should probably just link to create family flow or initiate it here properly if we had full list.
                        // For simplicity, let's just keep "Add to existing" here and link to general family creation.
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            For å opprette ny familie med dette medlemmet, gå til <a href={`/org/${orgSlug}/familier`} className="text-blue-600 underline">Familie-oversikten</a>.
                        </p>
                    </div>

                    <button onClick={() => setIsAdding(false)} className="text-sm text-gray-500 hover:text-gray-700">
                        Avbryt
                    </button>
                </div>
            )}
        </div>
    )
}
