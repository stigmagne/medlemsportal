import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If not logged in, redirect to login
    if (!user) {
        redirect('/login')
    }

    // Get user's roles from user_org_access - get ALL roles
    const { data: userAccess, error } = await supabase
        .from('user_org_access')
        .select('role, organization_id')
        .eq('user_id', user.id)

    console.log('User access data:', JSON.stringify(userAccess, null, 2))

    // If error or no access found, redirect to min-side portal instead of login to avoid loop
    if (error || !userAccess || userAccess.length === 0) {
        console.error('No access found for user:', user.id, error)
        redirect('/min-side')
    }

    // PRIORITY 1: Check if user is a superadmin (role = 'superadmin' AND organization_id IS NULL)
    const superadminAccess = userAccess.find(
        access => access.role === 'superadmin' && access.organization_id === null
    )

    if (superadminAccess) {
        console.log('Redirecting to superadmin dashboard')
        redirect('/superadmin/dashboard')
    }

    // PRIORITY 2: Find first organization access (for org_admin or other roles)
    const orgAccess = userAccess.find(access => access.organization_id !== null)

    if (!orgAccess) {
        // User has no valid organization access
        console.error('User has no valid organization access:', user.id)
        redirect('/min-side')
    }

    // Fetch slug for the organization
    const { data: orgData } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', orgAccess.organization_id)
        .single()

    if (!orgData?.slug) {
        console.error('Organization slug not found for id:', orgAccess.organization_id)
        redirect('/min-side')
    }

    console.log('Redirecting to organization dashboard:', orgData.slug)
    redirect(`/org/${orgData.slug}/dashboard`)
}
