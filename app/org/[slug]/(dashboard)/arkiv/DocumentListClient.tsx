
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { FileText, Download, Trash2, Lock, Globe, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import UploadDocumentModal from './UploadDocumentModal'

import { Document } from './types'

export default function DocumentListClient({
    documents,
    orgId,
    slug,
    isAdmin
}: {
    documents: Document[],
    orgId: string,
    slug: string,
    isAdmin: boolean
}) {
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [localDocuments, setLocalDocuments] = useState(documents)
    const [selectedCategory, setSelectedCategory] = useState<string>('Alle')

    const categories = ['Alle', ...Array.from(new Set(localDocuments.map(d => d.category || 'Generelt')))]
    const filteredDocuments = selectedCategory === 'Alle'
        ? localDocuments
        : localDocuments.filter(d => (d.category || 'Generelt') === selectedCategory)

    const supabase = createClient()

    const handleDownload = async (doc: Document) => {
        try {
            const { data, error } = await supabase.storage
                .from('org_documents')
                .download(doc.file_path)

            if (error) throw error

            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = doc.name
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download failed:', err)
            alert('Kunne ikke laste ned filen. Sjekk at du har tilgang.')
        }
    }

    const handleDelete = async (id: string, filePath: string) => {
        if (!confirm('Er du sikker på at du vil slette dette dokumentet?')) return

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('org_documents')
                .remove([filePath])

            if (storageError) throw storageError

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', id)

            if (dbError) throw dbError

            setLocalDocuments(prev => prev.filter(d => d.id !== id))
        } catch (err) {
            console.error('Delete failed:', err)
            alert('Kunne ikke slette dokumentet.')
        }
    }

    const formatSize = (bytes: number | null) => {
        if (!bytes) return '-'
        const units = ['B', 'KB', 'MB', 'GB']
        let size = bytes
        let unitIndex = 0
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024
            unitIndex++
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dokumentarkiv</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isAdmin ? 'Administrer foreningens dokumenter' : 'Oversikt over delte dokumenter'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Last opp
                    </button>
                )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Ingen dokumenter funnet.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredDocuments.map((doc) => (
                            <li key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.name}>
                                            {doc.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span>{format(new Date(doc.created_at), 'd. MMM yyyy', { locale: nb })}</span>
                                            <span>•</span>
                                            <span>{formatSize(doc.size_bytes)}</span>
                                            {isAdmin && (
                                                <>
                                                    <span>•</span>
                                                    <span className={`flex items-center gap-1 ${doc.access_level === 'public' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                        {doc.access_level === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                        {doc.access_level === 'public' ? 'Offentlig' : doc.access_level === 'board' ? 'Styret' : 'Admin'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                        title="Last ned"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(doc.id, doc.file_path)}
                                            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                                            title="Slett"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {isUploadOpen && (
                <UploadDocumentModal
                    orgId={orgId}
                    onClose={() => setIsUploadOpen(false)}
                    onUploadSuccess={(newDoc) => setLocalDocuments([newDoc, ...localDocuments])}
                />
            )}
        </div>
    )
}
