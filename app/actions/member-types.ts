'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MemberType {
    id: string
    name: string
    fee: number
    description?: string
}

export async function getMemberTypes(orgId: string) {
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

export async function createMemberType(orgId: string, name: string, fee: number, description: string = '', orgSlug: string) {
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
    const supabase = await createClient()

    const { error } = await supabase
        .from('member_types')
        .update({ name, fee })
        .eq('id', id)

    if (error) {
        return { error: 'Kunne ikke oppdatere medlemstype' }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger`)
    return { success: true }
}

export async function deleteMemberType(id: string, orgSlug: string) {
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

    // 2. Delete if safe
    const { error } = await supabase
        .from('member_types')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: 'Kunne ikke slette medlemstype' }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger`)
    return { success: true }
}
