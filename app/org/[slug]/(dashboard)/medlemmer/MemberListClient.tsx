'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Papa from 'papaparse'

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
}

export default function MemberListClient({ members, org_id, slug }: MemberListClientProps) {
    const t = useTranslations('Members.list')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

    // Filter members based on search and status
    const filteredMembers = members.filter(member => {
        // Status filter
        if (statusFilter !== 'all' && member.membership_status !== statusFilter) {
            return false
        }

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
            const email = member.email?.toLowerCase() || ''
            const phone = member.phone || ''
            const memberNumber = member.member_number.toLowerCase()

            return (
                fullName.includes(search) ||
                email.includes(search) ||
                phone.includes(search) ||
                memberNumber.includes(search)
            )
        }

        return true
    })

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {t('title')}
                </h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={() => {
                            const csv = Papa.unparse(filteredMembers.map(m => ({
                                Medlemsnummer: m.member_number,
                                Fornavn: m.first_name,
                                Etternavn: m.last_name,
                                Epost: m.email,
                                Telefon: m.phone,
                                Kategori: m.membership_category,
                                Status: m.membership_status
                            })))
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                            const link = document.createElement('a')
                            link.href = URL.createObjectURL(blob)
                            link.download = `medlemmer_${slug}_${new Date().toISOString().split('T')[0]}.csv`
                            link.click()
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">Eksporter</span>
                        <span className="sm:hidden">Eksporter CSV</span>
                    </button>
                    <Link
                        href={`/org/${slug}/medlemmer/import`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Importer CSV
                    </Link>
                    <Link
                        href={`/org/${slug}/medlemmer/ny`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Legg til medlem
                    </Link>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('filter.allStatus')}
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'active'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('filter.active')}
                        </button>
                        <button
                            onClick={() => setStatusFilter('inactive')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'inactive'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('filter.inactive')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Viser {filteredMembers.length} av {members.length} medlemmer
            </div>

            {/* Table - Desktop / Cards - Mobile */}
            {filteredMembers.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('headers.name')} (Medlemsnr)
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
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                                {member.first_name} {member.last_name}
                                                <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal">#{member.member_number}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {member.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded ${member.membership_status === 'active'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                        : member.membership_status === 'inactive'
                                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                                        }`}
                                                >
                                                    {member.membership_status === 'active' ? t('filter.active') : member.membership_status === 'inactive' ? t('filter.inactive') : t('filter.pending')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={`/org/${slug}/medlemmer/${member.id}`}
                                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="Rediger medlem"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredMembers.map((member) => (
                            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {member.first_name} {member.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">#{member.member_number}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded ${member.membership_status === 'active'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                            : member.membership_status === 'inactive'
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                            }`}
                                    >
                                        {member.membership_status === 'active' ? t('filter.active') : member.membership_status === 'inactive' ? t('filter.inactive') : t('filter.pending')}
                                    </span>
                                </div>
                                {member.email && (
                                    <div className="mb-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                                    </div>
                                )}
                                {member.phone && (
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                                    </div>
                                )}
                                <Link
                                    href={`/org/${slug}/medlemmer/${member.id}`}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Rediger medlem
                                </Link>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        {t('empty')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Prøv å endre søket eller filteret.'
                            : 'Kom i gang ved å legge til det første medlemmet!'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <div className="mt-6">
                            <Link
                                href={`/org/${slug}/medlemmer/ny`}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Legg til medlem
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
