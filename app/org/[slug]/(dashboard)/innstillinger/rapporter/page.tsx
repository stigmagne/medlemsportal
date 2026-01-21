
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportingDashboardClient from './ReportingDashboardClient'

export default async function ReportingPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Verify User & Org Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) redirect('/')

    const org_id = org.id

    // Check permissions (Admin only)
    const { data: access } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', org_id)
        .single()

    // Allow org_admin and superadmin (if global check handled elsewhere, 
    // but here strict RLS usually handles data, we restrict view to admins UI wise)
    if (!access || !['org_admin', 'superadmin'].includes(access.role)) {
        return <div className="p-8">Du har ikke tilgang til denne siden.</div>
    }

    // 2. Fetch Data from Views
    // Ensure RLS allows reading these views. 
    // Views generally run with permissions of the invoker, so user needs SELECT on underlying tables.
    // Since this is admin/stats, it should be fine for admins.

    const { data: stats, error: statsError } = await supabase
        .from('view_member_stats_by_age')
        .select('*')
        .eq('organization_id', org_id)
        .single()

    const { data: growth, error: growthError } = await supabase
        .from('view_member_growth_monthly')
        .select('*')
        .eq('organization_id', org_id)
        .order('month', { ascending: true })
        .limit(12) // Last 12 months

    if (statsError) console.error('Error fetching stats:', statsError)
    if (growthError) console.error('Error fetching growth:', growthError)

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <ReportingDashboardClient stats={stats} growth={growth || []} />
        </div>
    )
}
