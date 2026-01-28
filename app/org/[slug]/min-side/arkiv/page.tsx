
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentListClient from './DocumentListClient'

export default async function DocumentsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Auth Check
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 2. Org Check
    const { data: organization } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    // 3. Permission Check
    // We need to know if the user is admin/board to show upload buttons and private files
    const { data: userAccess } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .single()

    if (!userAccess) {
        // Double check membership if no explicit role
        const { data: membership } = await supabase
            .from('members')
            .select('id')
            .eq('email', user.email)
            .eq('organization_id', organization.id)
            .single()

        if (!membership) redirect('/')
    }

    const role = userAccess?.role || 'member'
    const isAdmin = role === 'org_admin' || role === 'superadmin'

    // 4. Fetch Documents
    // RLS will handle visibility, but we can verify here if we want specific ordering
    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false })

    return (
        <DocumentListClient
            documents={documents || []}
            orgId={organization.id}
            slug={slug}
            isAdmin={isAdmin}
        />
    )
}
