
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, Loader2, AlertCircle } from 'lucide-react'

import { Document } from './types'

type UploadDocumentModalProps = {
    orgId: string
    onClose: () => void
    onUploadSuccess: (doc: Document) => void
}

export default function UploadDocumentModal({ orgId, onClose, onUploadSuccess }: UploadDocumentModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [accessLevel, setAccessLevel] = useState<'public' | 'board' | 'admin'>('board')
    const [category, setCategory] = useState('Generelt')
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setIsUploading(true)
        setError(null)

        try {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = `${orgId}/${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('org_documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Metadata to Database
            const { data: docData, error: dbError } = await supabase
                .from('documents')
                .insert({
                    org_id: orgId,
                    name: file.name,
                    file_path: filePath,
                    size_bytes: file.size,
                    mime_type: file.type,
                    access_level: accessLevel,
                    category: category
                })
                .select()
                .single()

            if (dbError) {
                // Cleanup storage if DB fails
                await supabase.storage.from('org_documents').remove([filePath])
                throw dbError
            }

            onUploadSuccess(docData)
            onClose()
        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.message || 'Opplasting feilet')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Last opp dokument</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* File Input */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {file ? file.name : 'Velg fil å laste opp'}
                            </span>
                            <span className="text-xs text-gray-500">Klikk for å bla gjennom filer</span>
                        </label>
                    </div>

                    {/* Access Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tilgangsnivå
                        </label>
                        <select
                            value={accessLevel}
                            onChange={(e: any) => setAccessLevel(e.target.value)}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                        >
                            <option value="board">Styret (Standard)</option>
                            <option value="public">Offentlig (Alle medlemmer)</option>
                            <option value="admin">Kun Admin</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            {accessLevel === 'board' && 'Synlig for styret og administratorer.'}
                            {accessLevel === 'public' && 'Synlig for alle medlemmer i foreningen.'}
                            {accessLevel === 'admin' && 'Kun synlig for administratorer.'}
                        </p>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Kategori
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                        >
                            <option value="Generelt">Generelt</option>
                            <option value="Årsmøte">Årsmøte</option>
                            <option value="Regnskap">Regnskap</option>
                            <option value="Vedtekter">Vedtekter</option>
                            <option value="Styret">Styret</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={!file || isUploading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Last opp
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
