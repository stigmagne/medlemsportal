import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from './DashboardShell'

export default async function OrganizationLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    console.log('[Layout] Slug from params:', slug)

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    console.log('[Layout] User:', user?.id)

    if (!user) {
        console.log('[Layout] No user, redirecting to /login')
        redirect('/login')
    }

    // Get organization details by slug
    const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    console.log('[Layout] Organization query result:', { organization, orgError })

    if (!organization) {
        console.log('[Layout] No organization found, redirecting to /')
        redirect('/')
    }

    const org_id = organization.id
    console.log('[Layout] Organization ID:', org_id)

    // Verify user has access to this organization
    const { data: userAccess, error: accessError } = await supabase
        .from('user_org_access')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', org_id)

    console.log('[Layout] User access query:', { userAccess, accessError })

    // Find access for this specific organization
    const orgAccess = userAccess?.find(access => access.organization_id === org_id)

    console.log('[Layout] Org access found:', orgAccess)

    if (!orgAccess) {
        console.log('[Layout] No org access, redirecting to /')
        redirect('/')
    }

    console.log('[Layout] All checks passed, rendering dashboard')

    const handleSignOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/')
    }

    const orgName = organization?.name || 'Forening'
    const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bruker'

    return (
        <DashboardShell
            org={{
                name: orgName,
                role: orgAccess.role,
                slug: slug
            }}
            user={{
                displayName: userDisplayName,
                email: user.email || ''
            }}
            handleSignOut={handleSignOut}
        >
            {children}
        </DashboardShell>
    )
}
