'use client'

import { useState } from 'react'
import { exportMemberData, deleteMemberData } from '@/app/actions/gdpr'
import { Download, Trash2, AlertTriangle, Loader2, Shield, CheckCircle } from 'lucide-react'

type Props = {
    memberId: string
    memberName: string
    orgSlug: string
}

export default function GdprSection({ memberId, memberName, orgSlug }: Props) {
    const [exporting, setExporting] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteType, setDeleteType] = useState<'anonymize' | 'delete'>('anonymize')
    const [deleteReason, setDeleteReason] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleExport = async () => {
        setExporting(true)
        setMessage(null)

        try {
            const result = await exportMemberData(orgSlug, memberId)

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else if (result.data) {
                // Create and download JSON file
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `medlemsdata-${memberName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                setMessage({ type: 'success', text: 'Data eksportert' })
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Kunne ikke eksportere data' })
        } finally {
            setExporting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteReason.trim()) {
            setMessage({ type: 'error', text: 'Vennligst oppgi en grunn for sletting' })
            return
        }

        setDeleting(true)
        setMessage(null)

        try {
            const result = await deleteMemberData(orgSlug, memberId, {
                hardDelete: deleteType === 'delete',
                reason: deleteReason
            })

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: result.message || 'Medlem behandlet' })
                setShowDeleteConfirm(false)
                // Redirect after a moment
                setTimeout(() => {
                    window.location.href = `/org/${orgSlug}/medlemmer`
                }, 1500)
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Kunne ikke behandle forespørsel' })
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">GDPR & Personvern</h3>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <AlertTriangle className="w-4 h-4" />
                    )}
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                {/* Export section */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Eksporter data</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last ned alle registrerte opplysninger om medlemmet (GDPR Art. 15 & 20)
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Eksporter
                    </button>
                </div>

                {/* Delete section */}
                {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                            <p className="font-medium text-red-800 dark:text-red-200">Slett data</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                Anonymiser eller slett medlemmet permanent (GDPR Art. 17)
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <Trash2 className="w-4 h-4" />
                            Slett/Anonymiser
                        </button>
                    </div>
                ) : (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-200">
                                    Bekreft sletting av {memberName}
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    Denne handlingen kan ikke angres.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                    Velg type sletting
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="deleteType"
                                            value="anonymize"
                                            checked={deleteType === 'anonymize'}
                                            onChange={() => setDeleteType('anonymize')}
                                            className="text-red-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Anonymiser</strong> - Fjerner persondata men beholder statistikk
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="deleteType"
                                            value="delete"
                                            checked={deleteType === 'delete'}
                                            onChange={() => setDeleteType('delete')}
                                            className="text-red-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Permanent sletting</strong> - Fjerner all data fullstendig
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                    Grunn for sletting *
                                </label>
                                <input
                                    type="text"
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="F.eks. GDPR-forespørsel fra medlem"
                                    className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400"
                                >
                                    Avbryt
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting || !deleteReason.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    {deleteType === 'anonymize' ? 'Anonymiser' : 'Slett permanent'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                GDPR (General Data Protection Regulation) gir medlemmer rett til å få innsyn i,
                eksportere og slette sine personopplysninger.
            </p>
        </div>
    )
}
