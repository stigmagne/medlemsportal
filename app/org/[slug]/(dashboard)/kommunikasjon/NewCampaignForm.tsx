'use client'

import { useState } from 'react'
import { createCampaign, CampaignFilters } from './actions'
import RichTextEditor from '@/components/editor/RichTextEditor'

export default function NewCampaignForm({ org_id, onSuccess }: { org_id: string, onSuccess: () => void }) {
    const [subject, setSubject] = useState('')
    const [replyTo, setReplyTo] = useState('')
    const [content, setContent] = useState('')
    const [audienceType, setAudienceType] = useState<'all' | 'filtered'>('all')
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [customCategory, setCustomCategory] = useState('')
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        let filters: CampaignFilters | undefined = undefined
        if (audienceType === 'filtered') {
            filters = {}
            if (selectedStatuses.length > 0) filters.status = selectedStatuses
            if (customCategory.trim()) filters.category = [customCategory.trim()]
        }

        const res = await createCampaign(org_id, subject, content, filters, replyTo)

        if (res.error) {
            alert('Feil: ' + res.error)
        } else {
            setSubject('')
            setReplyTo('')
            setContent('')
            setAudienceType('all')
            setSelectedStatuses([])
            setCustomCategory('')
            onSuccess()
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ny E-post</h3>

            {/* Audience Selection */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mottakere</label>
                <div className="flex gap-4 mb-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            checked={audienceType === 'all'}
                            onChange={() => setAudienceType('all')}
                            className="mr-2"
                        />
                        <span className="text-sm dark:text-gray-300">Alle aktive medlemmer</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            checked={audienceType === 'filtered'}
                            onChange={() => setAudienceType('filtered')}
                            className="mr-2"
                        />
                        <span className="text-sm dark:text-gray-300">Velg spesifikke grupper</span>
                    </label>
                </div>

                {audienceType === 'filtered' && (
                    <div className="space-y-4 pl-4 border-l-2 border-blue-500">
                        {/* Status Filter */}
                        <div>
                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</span>
                            <div className="flex gap-3">
                                {['active', 'inactive', 'pending'].map(status => (
                                    <label key={status} className="flex items-center text-sm dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(status)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStatuses([...selectedStatuses, status])
                                                } else {
                                                    setSelectedStatuses(selectedStatuses.filter(s => s !== status))
                                                }
                                            }}
                                            className="mr-1 rounded border-gray-300"
                                        />
                                        {status === 'active' ? 'Aktiv' : status === 'inactive' ? 'Inaktiv' : 'Venter'}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Kategori (skriv inn nøyaktig navn)
                            </label>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="F.eks. Styremedlem"
                                className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-600 dark:border-gray-500 p-2"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emne</label>
                <input
                    type="text" required
                    value={subject} onChange={e => setSubject(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Svar-til E-post (Valgfritt)
                </label>
                <input
                    type="email"
                    value={replyTo} onChange={e => setReplyTo(e.target.value)}
                    placeholder="post@forening.no"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Hvis tom, brukes organisasjonens e-post.</p>
            </div>

            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Innhold (Bruk {'{{navn}}'} for fletting)
                    </label>
                    <button
                        type="button"
                        onClick={() => setPreview(!preview)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        {preview ? 'Rediger' : 'Forhåndsvisning'}
                    </button>
                </div>

                {preview ? (
                    <div className="border border-gray-200 rounded-md p-6 bg-white min-h-[300px] prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                ) : (
                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                        orgId={org_id}
                    />
                )}
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={onSuccess} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md">
                    Avbryt
                </button>
                <button
                    type="submit" disabled={loading}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                    {loading ? 'Lagrer utkast...' : 'Lagre Utkast'}
                </button>
            </div>
        </form>
    )
}
