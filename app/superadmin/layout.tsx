import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/theme-switcher'

export default async function SuperadminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    let user = null
    try {
        const {
            data: { user: authUser },
            error
        } = await supabase.auth.getUser()
        if (error) console.error("Layout Auth Error:", error)
        user = authUser
    } catch (e) {
        console.error("Layout Exception:", e)
    }

    if (!user) {
        redirect('/login')
    }

    // Verify user is superadmin
    let isSuperadmin = false
    try {
        const { data: userAccess } = await supabase
            .from('user_org_access')
            .select('role, organization_id')
            .eq('user_id', user.id)

        isSuperadmin = userAccess?.some(
            access => access.role === 'superadmin' && access.organization_id === null
        ) || false
    } catch (e) {
        console.error("Layout Superadmin Check Exception:", e)
    }

    if (!isSuperadmin) {
        redirect('/')
    }

    const handleSignOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/')
    }

    const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bruker'

    return (
        <div className="min-h-screen bg-muted/40">
            {/* Header */}
            <header className="bg-background shadow-sm border-b border-border">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-foreground">
                            Medlemsportalen
                        </h1>
                        <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                            Superadmin
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <span className="text-sm text-muted-foreground">
                            {userDisplayName}
                        </span>
                        <form action={handleSignOut}>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Logg ut
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-screen bg-background border-r border-border">
                    <nav className="p-4 space-y-2">
                        <Link
                            href="/superadmin/dashboard"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                        </Link>
                        <Link
                            href="/superadmin/settings"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Innstillinger
                        </Link>
                        <Link
                            href="/superadmin/calculator"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Kalkulator
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
