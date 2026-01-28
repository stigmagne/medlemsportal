'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireOrgAccess } from '@/lib/auth/helpers'

export interface MemberType {
    id: string
    name: string
    fee: number
    description?: string
}

export async function getMemberTypes(orgSlug: string) {
    // SECURITY: Verify org access and derive orgId server-side
    const { orgId } = await requireOrgAccess(orgSlug, 'org_member')

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('member_types')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching member types:', error)
        return []
    }

    return data as MemberType[]
}

export async function createMemberType(orgSlug: string, name: string, fee: number, description: string = '') {
    // SECURITY: Verify org access and derive orgId server-side
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    const { error } = await supabase
        .from('member_types')
        .insert({
            org_id: orgId,
            name,
            fee,
            description
        })

    if (error) {
        return { error: 'Kunne ikke opprette medlemstype' }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger`)
    return { success: true }
}

export async function updateMemberType(id: string, name: string, fee: number, orgSlug: string) {
    // SECURITY: Verify org access
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    // SECURITY: Ensure the member type belongs to this org
    const { error } = await supabase
        .from('member_types')
        .update({ name, fee })
        .eq('id', id)
        .eq('org_id', orgId)

    if (error) {
        return { error: 'Kunne ikke oppdatere medlemstype' }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger`)
    return { success: true }
}

export async function deleteMemberType(id: string, orgSlug: string) {
    // SECURITY: Verify org access
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    // 1. Check if any members are using this type
    const { count, error: countError } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('member_type_id', id)

    if (countError) {
        return { error: 'Kunne ikke sjekke om typen er i bruk' }
    }

    if (count && count > 0) {
        return {
            error: `Kan ikke slette denne typen fordi ${count} medlemmer bruker den. Du må endre typen til disse medlemmene først.`
        }
    }

    // 2. Delete if safe (and verify org ownership)
    const { error } = await supabase
        .from('member_types')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId)

    if (error) {
        return { error: 'Kunne ikke slette medlemstype' }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger`)
    return { success: true }
}
