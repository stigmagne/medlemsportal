import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewMemberForm from './NewMemberForm'

export default async function NewMemberPage({
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

    // Generate next member number
    // Get the highest member number for this organization
    const { data: lastMember } = await supabase
        .from('members')
        .select('member_number')
        .eq('organization_id', org_id)
        .order('member_number', { ascending: false })
        .limit(1)
        .single()

    let nextMemberNumber = '1001' // Default starting number

    if (lastMember && lastMember.member_number) {
        // Extract numeric part and increment
        const numericPart = parseInt(lastMember.member_number.replace(/\D/g, ''), 10)
        if (!isNaN(numericPart)) {
            nextMemberNumber = String(numericPart + 1)
        }
    }

    // Get member types
    const { data: memberTypes } = await supabase
        .from('member_types')
        .select('*')
        .eq('org_id', org_id)
        .order('name', { ascending: true })

    return <NewMemberForm org_id={org_id} nextMemberNumber={nextMemberNumber} slug={slug} memberTypes={memberTypes || []} />
}
