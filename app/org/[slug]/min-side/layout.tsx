import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MinSideShell from './MinSideShell'

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

    return (
        <MinSideShell slug={slug} orgName={organization.name}>
            {children}
        </MinSideShell>
    )
}
