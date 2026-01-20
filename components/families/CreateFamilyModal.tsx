'use client'

import { useState } from 'react'
import { createFamily } from '@/app/actions/families'

// Simple Dialog/Modal implementation since shadcn might be missing
function Modal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default function CreateFamilyModal({ orgId, availableMembers, onSuccess }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [payerId, setPayerId] = useState<string>('')
    const [familyName, setFamilyName] = useState('')
    const [error, setError] = useState('')

    const handleOpen = () => {
        setIsOpen(true)
        setStep(1)
        setSelectedMembers([])
        setPayerId('')
        setFamilyName('')
        setError('')
    }

    const handleNext = () => {
        if (selectedMembers.length < 2) {
            setError('Velg minst 2 medlemmer')
            return
        }
        setError('')
        setStep(2)
        // Default payer to first selected
        if (!payerId && selectedMembers.length > 0) {
            setPayerId(selectedMembers[0])
        }
    }

    const handleSubmit = async () => {
        const res = await createFamily({
            org_id: orgId,
            member_ids: selectedMembers,
            payer_member_id: payerId,
            family_name: familyName
        })

        if (res.error) {
            setError(res.error)
        } else {
            setIsOpen(false)
            if (onSuccess) onSuccess()
        }
    }

    const toggleMember = (id: string) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(selectedMembers.filter(m => m !== id))
        } else {
            setSelectedMembers([...selectedMembers, id])
        }
    }

    return (
        <>
            <button
                onClick={handleOpen}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                + Opprett ny familie
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Opprett ny familie">
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Familienavn (valgfritt)</label>
                            <input
                                type="text"
                                value={familyName}
                                onChange={e => setFamilyName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 p-2 border"
                                placeholder="F.eks. Hansen-familien"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Velg medlemmer</label>
                            <div className="max-h-60 overflow-y-auto border rounded-md border-gray-200 dark:border-gray-700">
                                {availableMembers.map((m: any) => (
                                    <div key={m.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={selectedMembers.includes(m.id)}
                                            onChange={() => toggleMember(m.id)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-900 dark:text-gray-200">
                                            {m.first_name} {m.last_name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Valgt: {selectedMembers.length} (Minst 2 påkrevd)</p>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setIsOpen(false)} className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800">Avbryt</button>
                            <button
                                onClick={handleNext}
                                disabled={selectedMembers.length < 2}
                                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                            >
                                Neste
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hvem skal være betaler?</label>
                            <div className="space-y-2">
                                {availableMembers
                                    .filter((m: any) => selectedMembers.includes(m.id))
                                    .map((m: any) => (
                                        <div key={m.id} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payer"
                                                value={m.id}
                                                checked={payerId === m.id}
                                                onChange={(e) => setPayerId(e.target.value)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-900 dark:text-gray-200">
                                                {m.first_name} {m.last_name}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(1)} className="text-blue-600 hover:text-blue-800 text-sm">Tilbake</button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Opprett familie
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}
