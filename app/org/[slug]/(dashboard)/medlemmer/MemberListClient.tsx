'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

type Member = {
    id: string
    member_number: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    membership_category: string | null
    membership_status: 'active' | 'inactive' | 'pending'
}

type MemberListClientProps = {
    members: Member[]
    org_id: string
    slug: string
    totalCount: number
    currentPage: number
    totalPages: number
    perPage: number
    currentSort?: string
}

export default function MemberListClient({
    members,
    org_id,
    slug,
    totalCount,
    currentPage,
    totalPages,
    perPage,
    currentSort = 'name'
}: MemberListClientProps) {
    const t = useTranslations('Members.list')
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // State
    const [isExporting, setIsExporting] = useState(false)
    const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '')
    const debouncedSearch = useDebounce(localSearch, 500)

    // Sync URL with search and filter
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(name, value)
            } else {
                params.delete(name)
            }
            // Reset page when filtering/searching
            if (name !== 'page') {
                params.set('page', '1')
            }
            return params.toString()
        },
        [searchParams]
    )

    // Effect to update URL when debounced search changes
    useEffect(() => {
        const currentQ = searchParams.get('q') || ''
        if (debouncedSearch !== currentQ) {
            router.push(pathname + '?' + createQueryString('q', debouncedSearch))
        }
    }, [debouncedSearch, pathname, router, createQueryString, searchParams])

    const handleStatusFilterChange = (status: string) => {
        router.push(pathname + '?' + createQueryString('status', status === 'all' ? '' : status))
    }

    const handleSortChange = (sort: string) => {
        router.push(pathname + '?' + createQueryString('sort', sort === 'name' ? '' : sort))
    }

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(pathname + '?' + params.toString())
    }

    // On-demand fetch for export
    const handleExport = async () => {
        setIsExporting(true)
        try {
            const supabase = createClient()
            const q = searchParams.get('q')
            const status = searchParams.get('status')

            let query = supabase
                .from('members')
                .select(`
                    member_number,
                    first_name,
                    last_name,
                    email,
                    phone,
                    membership_category,
                    membership_status,
                    member_types (name)
                `)
                .eq('organization_id', org_id)
                .is('deleted_at', null)

            // Replicate server-side filters
            if (status) {
                query = query.eq('membership_status', status)
            }
            if (q) {
                query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,member_number.ilike.%${q}%`)
            }

            const { data, error } = await query

            if (error) throw error

            const exportData = data?.map(m => ({
                Medlemsnummer: m.member_number,
                Fornavn: m.first_name,
                Etternavn: m.last_name,
                Epost: m.email,
                Telefon: m.phone,
                Kategori: Array.isArray(m.member_types) && m.member_types.length > 0 ? m.member_types[0].name : m.membership_category,
                Status: m.membership_status
            }))

            const csv = Papa.unparse(exportData || [])
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `medlemmer_${slug}_${new Date().toISOString().split('T')[0]}.csv`
            link.click()
        } catch (err) {
            console.error('Export failed', err)
            alert('Kunne ikke eksportere medlemmer. Prøv igjen.')
        } finally {
            setIsExporting(false)
        }
    }

    const currentStatus = searchParams.get('status') || 'all'

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {t('title')} <span className="text-lg font-normal text-gray-500">({totalCount})</span>
                </h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        )}
                        <span className="hidden sm:inline">Eksporter</span>
                        <span className="sm:hidden">CSV</span>
                    </button>
                    <Link
                        href={`/org/${slug}/medlemmer/import`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Importer
                    </Link>
                    <Link
                        href={`/org/${slug}/medlemmer/ny`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Legg til
                    </Link>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex gap-2">
                        {['all', 'active', 'inactive'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusFilterChange(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${currentStatus === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {status === 'all' ? t('filter.allStatus') : t(`filter.${status}`)}
                            </button>
                        ))}
                    </div>

                    {/* Sort dropdown */}
                    <select
                        value={currentSort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="name">Navn (A-Å)</option>
                        <option value="newest">Nyeste først</option>
                        <option value="oldest">Eldste først</option>
                    </select>
                </div>
            </div>

            {/* Table - Desktop */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hidden md:block">
                {members.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('headers.name')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('headers.email')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('headers.status')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('headers.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                            {member.first_name} {member.last_name}
                                            <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal">#{member.member_number}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {member.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${member.membership_status === 'active'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                : member.membership_status === 'inactive'
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                                }`}>
                                                {member.membership_status === 'active' ? t('filter.active') : member.membership_status === 'inactive' ? t('filter.inactive') : t('filter.pending')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <Link
                                                href={`/org/${slug}/medlemmer/${member.id}`}
                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                Rediger
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8">
                        <EmptyState
                            icon={Users}
                            title="Ingen medlemmer funnet"
                            description="Prøv å endre søkefilteret eller legg til et nytt medlem."
                            action={{
                                label: "Legg til medlem",
                                onClick: () => router.push(`/org/${slug}/medlemmer/ny`)
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {members.length > 0 ? members.map((member) => (
                    <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {member.first_name} {member.last_name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">#{member.member_number}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${member.membership_status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800'
                                }`}>
                                {member.membership_status}
                            </span>
                        </div>
                        <Link
                            href={`/org/${slug}/medlemmer/${member.id}`}
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Rediger
                        </Link>
                    </div>
                )) : (
                    <EmptyState
                        icon={Users}
                        title="Ingen medlemmer"
                        description="Ingen medlemmer matcher kriteriene."
                    />
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Forrige
                    </button>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Side <span className="font-medium">{currentPage}</span> av <span className="font-medium">{totalPages}</span>
                    </div>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Neste
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            )}
        </div>
    )
}
