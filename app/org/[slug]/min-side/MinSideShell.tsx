'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function MinSideShell({
    children,
    slug,
    orgName,
}: {
    children: React.ReactNode
    slug: string
    orgName: string
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                type="button"
                                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                <span className="sr-only">Åpne meny</span>
                                {mobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>

                            <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
                                <Link href={`/org/${slug}/min-side`} className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                    Min Side - {orgName}
                                </Link>
                            </div>
                        </div>

                        {/* Desktop navigation */}
                        <div className="hidden md:ml-6 md:flex md:space-x-8">
                            <Link
                                href={`/org/${slug}/min-side`}
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Oversikt
                            </Link>
                            <Link
                                href={`/org/${slug}/min-side/profil`}
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Min Profil
                            </Link>
                            <Link
                                href={`/org/${slug}/min-side/dugnad`}
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Dugnad
                            </Link>
                            <Link
                                href={`/org/${slug}/min-side/booking`}
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Booking
                            </Link>
                        </div>

                        {/* Desktop right section */}
                        <div className="hidden md:flex md:items-center md:gap-4">
                            <Link
                                href="/min-side"
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                                Bytt forening
                            </Link>
                            <div className="flex-shrink-0">
                                <form action="/auth/signout" method="post">
                                    <button
                                        type="submit"
                                        className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Logg ut
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="pt-2 pb-3 space-y-1">
                            <Link
                                href={`/org/${slug}/min-side`}
                                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Oversikt
                            </Link>
                            <Link
                                href={`/org/${slug}/min-side/profil`}
                                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Min Profil
                            </Link>
                            <Link
                                href={`/org/${slug}/min-side/dugnad`}
                                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Dugnad
                            </Link>
                            <Link
                                href={`/org/${slug}/min-side/booking`}
                                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Booking
                            </Link>
                        </div>
                        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center px-4 space-y-2 flex-col">
                                <Link
                                    href="/min-side"
                                    className="text-base font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Bytt forening
                                </Link>
                                <form action="/auth/signout" method="post" className="w-full">
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Logg ut
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main className="py-6 md:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
