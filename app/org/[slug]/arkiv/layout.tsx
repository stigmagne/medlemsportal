import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberSidebarShell from '../min-side/MemberSidebarShell'
import DashboardShell from '../(dashboard)/DashboardShell'

export default async function ArkivLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    // Auth check
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    // Verify user has access
    const { data: access } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .single()

    if (!access) {
        // Check if they're a member
        const { data: membership } = await supabase
            .from('members')
            .select('id')
            .eq('email', user.email)
            .eq('organization_id', organization.id)
            .single()

        if (!membership) redirect('/')
    }

    const userRole = access?.role || 'org_member'
    const isAdmin = userRole === 'org_admin' || userRole === 'superadmin'

    // Get user display name
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

    // Server action for sign out
    async function handleSignOut() {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/')
    }

    // Use admin sidebar for admins, member sidebar for regular members
    if (isAdmin) {
        return (
            <DashboardShell
                org={{
                    name: organization.name,
                    role: userRole,
                    slug: slug
                }}
                user={{
                    displayName: displayName,
                    email: user.email || ''
                }}
                handleSignOut={handleSignOut}
            >
                {children}
            </DashboardShell>
        )
    }

    return (
        <MemberSidebarShell
            org={{
                name: organization.name,
                slug: slug
            }}
            user={{
                displayName: displayName,
                email: user.email || '',
                role: userRole
            }}
            handleSignOut={handleSignOut}
        >
            {children}
        </MemberSidebarShell>
    )
}
