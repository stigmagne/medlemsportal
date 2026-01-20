import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberListClient from './MemberListClient'

export default async function MembersPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get organization details by slug
    const { data: organization } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    const org_id = organization.id

    // Verify user has access to this organization
    const { data: userAccess } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', org_id)

    if (!userAccess || userAccess.length === 0) {
        redirect('/')
    }

    // Fetch members for this organization
    const { data: membersData, error } = await supabase
        .from('members')
        .select(`
            id, 
            member_number, 
            first_name, 
            last_name, 
            email, 
            phone, 
            membership_category,
            membership_status,
            member_types (
                name
            )
        `)
        .eq('organization_id', org_id)
        .is('deleted_at', null) // Only show non-deleted members
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

    if (error) {
        console.error('Error fetching members:', {
            error: error,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        })
    }

    // Map dynamic type name to membership_category for display
    const members = membersData?.map(member => {
        const memberTypeName = Array.isArray(member.member_types) && member.member_types.length > 0
            ? member.member_types[0].name
            : null;

        return {
            ...member,
            membership_category: memberTypeName || member.membership_category
        };
    })

    return <MemberListClient members={members || []} org_id={org_id} slug={slug} />
}
