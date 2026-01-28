'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home, User, Wrench, Calendar, Receipt, CreditCard,
    Folder, Settings, ChevronDown, ChevronRight,
    LayoutDashboard, Users, MessageSquare, FileText, Gavel
} from 'lucide-react'

interface MemberSidebarShellProps {
    children: React.ReactNode
    org: {
        name: string
        slug: string
    }
    user: {
        displayName: string
        email: string
        role: string // 'org_admin' | 'org_member' | 'superadmin'
    }
    handleSignOut: () => Promise<void>
}

type NavItem = {
    label: string
    icon: React.ReactNode
    href?: string
    adminOnly?: boolean
    children?: NavItem[]
}

export default function MemberSidebarShell({
    children,
    org,
    user,
    handleSignOut
}: MemberSidebarShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

    const pathname = usePathname()

    const isActive = (path?: string) => {
        if (!path) return false
        return pathname === path || pathname?.startsWith(`${path}/`)
    }

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // Member navigation items
    const navItems: NavItem[] = [
        {
            href: `/org/${org.slug}/min-side`,
            label: 'Oversikt',
            icon: <Home className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/min-side/profil`,
            label: 'Min Profil',
            icon: <User className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/min-side/dugnad`,
            label: 'Dugnad',
            icon: <Wrench className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/min-side/booking`,
            label: 'Booking',
            icon: <Calendar className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/min-side/utlegg`,
            label: 'Utlegg',
            icon: <Receipt className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/min-side/medlemskort`,
            label: 'Medlemskort',
            icon: <CreditCard className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/arkiv`,
            label: 'Arkiv',
            icon: <Folder className="w-5 h-5" />
        }
    ]

    // Admin-only links (shown if user is org_admin)
    const adminNavItems: NavItem[] = [
        {
            href: `/org/${org.slug}/dashboard`,
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            adminOnly: true
        },
        {
            href: `/org/${org.slug}/medlemmer`,
            label: 'Medlemmer',
            icon: <Users className="w-5 h-5" />,
            adminOnly: true
        },
        {
            href: `/org/${org.slug}/kommunikasjon`,
            label: 'Kommunikasjon',
            icon: <MessageSquare className="w-5 h-5" />,
            adminOnly: true
        },
        {
            href: `/org/${org.slug}/moter`,
            label: 'Møter & Saker',
            icon: <FileText className="w-5 h-5" />,
            adminOnly: true
        },
        {
            href: `/org/${org.slug}/innstillinger`,
            label: 'Innstillinger',
            icon: <Settings className="w-5 h-5" />,
            adminOnly: true
        }
    ]

    const isAdmin = user.role === 'org_admin' || user.role === 'superadmin'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 md:hidden p-4 flex justify-between items-center z-20 relative">
                <span className="font-bold text-lg dark:text-white">{org.name}</span>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                    <span className="sr-only">Toggle menu</span>
                    {sidebarOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </header>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 transition duration-200 ease-in-out
                w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                flex flex-col z-10
            `}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                    <div className="block md:flex md:items-center md:justify-between">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden md:block">
                            {org.name}
                        </h1>
                    </div>

                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded self-start">
                        Min Side
                    </span>

                    {/* User info in sidebar on mobile */}
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.displayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                        <button
                            onClick={async () => await handleSignOut()}
                            className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium"
                        >
                            Logg ut
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {/* Member Navigation */}
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href!}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                    ${isActive(item.href)
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Admin Navigation (if applicable) */}
                    {isAdmin && (
                        <>
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Admin
                                </div>
                            </div>
                            <div className="space-y-1">
                                {adminNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href!}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                            ${isActive(item.href)
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Switch Organization */}
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                            href="/min-side"
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Bytt forening
                        </Link>
                    </div>
                </nav>

                {/* User Footer (Desktop) */}
                <div className="hidden md:block p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.displayName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={async () => await handleSignOut()}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Logg ut
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-8 md:p-8 pt-6 overflow-x-hidden">
                {children}
            </main>
        </div>
    )
}
