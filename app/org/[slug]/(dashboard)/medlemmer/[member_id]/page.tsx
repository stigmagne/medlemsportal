import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import EditMemberForm from './EditMemberForm'
import MemberFamilySection from '@/components/families/MemberFamilySection'
import GdprSection from '@/components/members/GdprSection'

export default async function EditMemberPage({
    params,
}: {
    params: Promise<{ slug: string; member_id: string }>
}) {
    const { slug, member_id } = await params
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

    // Fetch member data with family info
    const { data: member, error } = await supabase
        .from('members')
        .select(`
            *,
            family:families!family_id(
                id, 
                family_name, 
                payer:members!payer_member_id(first_name, last_name)
            )
        `)
        .eq('id', member_id)
        .eq('organization_id', org_id) // Ensure member belongs to this org
        .is('deleted_at', null) // Only show non-deleted members
        .single()

    if (error || !member) {
        console.error('Error fetching member:', error)
        notFound()
    }

    // Fetch available families for assignment (only if not in a family)
    let availableFamilies: any[] = []
    if (!member.family_id) {
        const { data: families } = await supabase
            .from('families')
            .select(`
                id, 
                family_name,
                payer:members!payer_member_id(first_name, last_name)
            `)
            .eq('org_id', org_id)
            .order('family_name')
        availableFamilies = families || []
    }

    // Fetch member types
    const { data: memberTypes } = await supabase
        .from('member_types')
        .select('*')
        .eq('org_id', org_id)
        .order('name', { ascending: true })

    return (
        <div className="max-w-4xl">
            <EditMemberForm member={member} org_id={org_id} slug={slug} memberTypes={memberTypes || []} />
            <div className="mt-8 border-t pt-8">
                <h2 className="text-xl font-bold mb-4">Familiekobling</h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <MemberFamilySection
                        member={member}
                        orgId={org_id}
                        orgSlug={slug}
                        availableFamilies={availableFamilies}
                    />
                </div>
            </div>

            <div className="mt-8 border-t pt-8">
                <h2 className="text-xl font-bold mb-4">GDPR & Personvern</h2>
                <GdprSection
                    memberId={member.id}
                    memberName={`${member.first_name} ${member.last_name}`}
                    orgSlug={slug}
                />
            </div>
        </div>
    )
}
