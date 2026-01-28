import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberSidebarShell from './MemberSidebarShell'

export default async function MinSideLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

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

    // Verify user is a member of this organization
    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('email', user.email)
        .is('deleted_at', null)
        .single()

    if (!member) {
        // Logged in but not a member of this specific org -> redirect to portal
        redirect('/min-side')
    }

    // Get user role from user_org_access
    const { data: access } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .single()

    const userRole = access?.role || 'org_member'

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
