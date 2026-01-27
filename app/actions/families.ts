'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'

interface CreateFamilyInput {
    org_id: string
    family_name?: string
    member_ids: string[]
    payer_member_id: string
}

export async function createFamily(orgSlug: string, data: Omit<CreateFamilyInput, 'org_id'>) {
    // SECURITY: Require admin access
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Validation
    if (data.member_ids.length < 2) {
        return { error: 'En familie må ha minst 2 medlemmer' }
    }

    if (!data.member_ids.includes(data.payer_member_id)) {
        return { error: 'Betaleren må være et av familiemedlemmene' }
    }

    // Check if members are already in a family
    const { data: existingMembers } = await supabase
        .from('members')
        .select('id, first_name, last_name, family_id')
        .in('id', data.member_ids)
        .not('family_id', 'is', null)

    if (existingMembers && existingMembers.length > 0) {
        const names = existingMembers.map(m => `${m.first_name} ${m.last_name}`).join(', ')
        return {
            error: `Følgende medlemmer er allerede i en familie: ${names}`
        }
    }

    // Create family
    // If no name provided, use Payer's last name + "familien" or similar could be done here, 
    // but let's stick to provided logic or default text.
    const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
            org_id: orgId,  // Server-verified orgId (IDOR FIX)
            family_name: data.family_name || 'Ny Familie',
            payer_member_id: data.payer_member_id
        })
        .select()
        .single()

    if (familyError) {
        return { error: familyError.message }
    }

    // Update all members to point to this family
    const { error: updateError } = await supabase
        .from('members')
        .update({ family_id: family.id })
        .in('id', data.member_ids)

    if (updateError) {
        // Rollback - delete family if linking fails
        await supabase.from('families').delete().eq('id', family.id)
        return { error: updateError.message }
    }

    revalidatePath(`/org/${orgSlug}/dashboard/familier`)
    return { success: true, family }
}

export async function updateFamily(
    orgSlug: string,
    familyId: string,
    updates: {
        family_name?: string
        payer_member_id?: string
    }
) {
    // SECURITY: Require admin access
    await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    const { error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', familyId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/org/${orgSlug}/dashboard/familier`)
    return { success: true }
}

export async function deleteFamily(familyId: string, orgSlug: string) {
    // SECURITY: Require admin access
    await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Remove family_id from all members
    await supabase
        .from('members')
        .update({ family_id: null })
        .eq('family_id', familyId)

    // Delete family
    const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/org/${orgSlug}/dashboard/familier`)
    return { success: true }
}

export async function addMemberToFamily(
    orgSlug: string,
    memberId: string,
    familyId: string
) {
    // SECURITY: Require admin access
    await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Check if member already in family
    const { data: member } = await supabase
        .from('members')
        .select('family_id, first_name')
        .eq('id', memberId)
        .single()

    if (member?.family_id) {
        return { error: `${member.first_name} er allerede i en familie` }
    }

    const { error } = await supabase
        .from('members')
        .update({ family_id: familyId })
        .eq('id', memberId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/org/${orgSlug}/dashboard/familier`)
    return { success: true }
}

export async function removeMemberFromFamily(orgSlug: string, memberId: string) {
    // SECURITY: Require admin access
    await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Check if this is the payer
    const { data: family } = await supabase
        .from('families')
        .select('id, payer_member_id, family_name')
        .eq('payer_member_id', memberId)
        .single()

    if (family) {
        return {
            error: 'Kan ikke fjerne betaleren fra familien. Velg en ny betaler først.'
        }
    }

    // Get familyId before removal to check count later
    const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('id', memberId)
        .single()

    const familyId = member?.family_id

    const { error } = await supabase
        .from('members')
        .update({ family_id: null })
        .eq('id', memberId)

    if (error) {
        return { error: error.message }
    }

    // Check if family has < 2 members left
    if (familyId) {
        const { count } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)

        if (count !== null && count < 2) {
            // Dissolve family automatically
            await deleteFamily(familyId, orgSlug)
            return {
                success: true,
                message: 'Medlem fjernet. Familien ble oppløst da det kun var 1 medlem igjen.'
            }
        }
    }

    revalidatePath(`/org/${orgSlug}/dashboard/familier`)
    return { success: true }
}

export async function getOrgFamilies(orgSlug: string) {
    // SECURITY: Require at least member access to view families
    const { orgId } = await requireOrgAccess(orgSlug, 'org_member')
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('families')
        .select(`
      *,
      payer:members!families_payer_member_id_fkey(id, first_name, last_name, email),
      family_members:members!members_family_id_fkey(id, first_name, last_name, email, membership_status)
    `)
        .eq('org_id', orgId)  // Server-verified orgId (IDOR FIX)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching families:', JSON.stringify(error, null, 2))
        return []
    }

    // Map to friendly format if needed, or return raw
    return data
}
