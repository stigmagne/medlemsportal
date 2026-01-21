'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
    LayoutDashboard, Users, Home, Calendar,
    CreditCard, Receipt, Users2, FileText, Settings, User,
    Wallet, ChevronDown, ChevronRight, Folder, PieChart, MessageSquare
} from 'lucide-react'

interface DashboardShellProps {
    children: React.ReactNode
    org: {
        name: string
        role: string
        slug: string
    }
    user: {
        displayName: string
        email: string
    }
    handleSignOut: () => Promise<void>
}

type NavItem = {
    label: string
    icon: React.ReactNode
    href?: string
    children?: NavItem[]
}

export default function DashboardShell({
    children,
    org,
    user,
    handleSignOut
}: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        'okonomi': true // Default open? Or check if children active
    })

    const pathname = usePathname()
    const t = useTranslations('Dashboard')

    const isActive = (path?: string) => {
        if (!path) return false
        return pathname === path || pathname?.startsWith(`${path}/`)
    }

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const navItems: NavItem[] = [
        {
            href: `/org/${org.slug}/dashboard`,
            label: t('nav.dashboard'),
            icon: <LayoutDashboard className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/medlemmer`,
            label: t('nav.members'),
            icon: <Users className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/familier`,
            label: 'Familier',
            icon: <Home className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/arrangementer`,
            label: 'Arrangementer',
            icon: <Calendar className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/kommunikasjon`,
            label: t('nav.communication'),
            icon: <MessageSquare className="w-5 h-5" />
        },
        {
            label: 'Økonomi',
            icon: <Wallet className="w-5 h-5" />,
            // Key for state tracking
            // Use label as key for simplicity in this demo or add id
            children: [
                {
                    href: `/org/${org.slug}/betalinger`,
                    label: 'Betalinger',
                    icon: <CreditCard className="w-5 h-5" />
                },
                {
                    href: `/org/${org.slug}/utlegg`,
                    label: 'Utlegg (Admin)',
                    icon: <Receipt className="w-5 h-5" />
                }
            ]
        },
        {
            href: `/org/${org.slug}/moter`,
            label: 'Møter',
            icon: <Users2 className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/arkiv`,
            label: 'Dokumentarkiv',
            icon: <Folder className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/saker/ny`, // TODO: Point to /saker list when ready
            label: 'Ny Sak',
            icon: <FileText className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/innstillinger`,
            label: 'Innstillinger',
            icon: <Settings className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/innstillinger/rapporter`,
            label: 'Rapportering',
            icon: <PieChart className="w-5 h-5" />
        },
        {
            href: `/org/${org.slug}/kommunikasjon/sms`,
            label: 'Kommunikasjon',
            icon: <MessageSquare className="w-5 h-5" />
        }
    ]

    const memberNavItems = [
        {
            href: `/org/${org.slug}/minside`,
            label: t('nav.minSide'),
            icon: <User className="w-5 h-5" />
        }
    ]

    // Helper to determine if a group should be open based on active child
    // Simplistic approach: if any child is active, we can set default state or just let user toggle. 
    // In strict mode we might sync this with useEffect but simple toggle is often enough.

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 md:hidden p-4 flex justify-between items-center z-20 relative">
                <span className="font-bold text-lg dark:text-white">{org.name}</span>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                    <span className="sr-only">{t('toggleMenu')}</span>
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

            {/* Sidebar / Mobile Menu */}
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
                        {org.role === 'org_admin' ? t('role.admin') : t('role.member')}
                    </span>

                    {/* User info in sidebar on mobile */}
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.displayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                        <button
                            onClick={async () => await handleSignOut()}
                            className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium"
                        >
                            {t('logout')}
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item, index) => {
                        if (item.children) {
                            // Render Group
                            const isOpen = openGroups[item.label] || item.children.some(c => c.href && isActive(c.href))
                            return (
                                <div key={index} className="space-y-1">
                                    <button
                                        onClick={() => toggleGroup(item.label)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            {item.label}
                                        </div>
                                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>

                                    {isOpen && (
                                        <div className="pl-4 space-y-1 border-l-2 border-gray-100 ml-4">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href!}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                                        ${isActive(child.href)
                                                            ? 'text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/10'
                                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                        }
                                                    `}
                                                >
                                                    {child.icon}
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        // Render Single Link
                        return (
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
                        )
                    })}

                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                        {memberNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
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
                </nav>

                {/* User Footer (Desktop) */}
                <div className="hidden md:block p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.displayName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={async () => await handleSignOut()}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t('logout')}
                    </button>
                    <div className="mt-4 text-center flex flex-col gap-1">
                        <Link href="/personvern" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            Personvernerklæring
                        </Link>
                        <Link href="/databehandleravtale" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            Databehandleravtale
                        </Link>
                    </div>
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
