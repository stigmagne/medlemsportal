import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { SuperadminSidebarNav } from '@/components/superadmin-nav'
import { SuperadminMobileNav } from '@/components/superadmin-mobile-nav'

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
                        <h1 className="text-xl font-bold text-foreground hidden md:block">
                            Medlemsportalen
                        </h1>
                        <h1 className="text-lg font-bold text-foreground md:hidden">
                            Portal
                        </h1>
                        <span className="hidden md:inline-flex px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                            Superadmin
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeSwitcher />
                        <div className="hidden md:block">
                            <span className="text-sm text-muted-foreground mr-4">
                                {userDisplayName}
                            </span>
                        </div>
                        <div className="hidden md:block">
                            <form action={handleSignOut}>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Logg ut
                                </button>
                            </form>
                        </div>
                        <SuperadminMobileNav />
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden md:block w-64 min-h-screen bg-background border-r border-border">
                    <SuperadminSidebarNav />
                </aside>


                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
