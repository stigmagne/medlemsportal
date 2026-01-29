import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberListClient from './MemberListClient'

export default async function MembersPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug } = await params
    const resolvedSearchParams = await searchParams
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

    // Pagination & Filter params
    const page = Number(resolvedSearchParams.page) || 1
    const perPage = 50 // Show 50 per page
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    const q = (resolvedSearchParams.q as string) || ''
    const status = (resolvedSearchParams.status as string) || ''
    const sort = (resolvedSearchParams.sort as string) || 'name'

    // Fetch members with filters and pagination
    let query = supabase
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
            created_at,
            member_types (
                name
            )
        `, { count: 'exact' }) // Get total count
        .eq('organization_id', org_id)
        .is('deleted_at', null)

    // Apply filters
    if (status && status !== 'all') {
        query = query.eq('membership_status', status)
    }

    if (q) {
        // Search in multiple fields
        query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,member_number.ilike.%${q}%`)
    }

    // Apply sorting
    if (sort === 'newest') {
        query = query.order('created_at', { ascending: false })
    } else if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true })
    } else {
        // Default: sort by name
        query = query.order('last_name', { ascending: true }).order('first_name', { ascending: true })
    }

    const { data: membersData, count, error } = await query.range(from, to)

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

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / perPage)

    return (
        <MemberListClient
            members={members || []}
            org_id={org_id}
            slug={slug}
            totalCount={totalCount}
            currentPage={page}
            totalPages={totalPages}
            perPage={perPage}
            currentSort={sort}
        />
    )
}
