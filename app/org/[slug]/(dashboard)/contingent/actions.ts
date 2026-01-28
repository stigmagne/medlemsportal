'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/helpers'
import { sanitizeError } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

export type MembershipFee = {
    id: string
    name: string
    amount: number
    currency: string
    due_date?: string
    is_active: boolean
    created_at: string
}

/**
 * SECURITY (M9): Standardized auth pattern for membership fee creation
 */
export async function createMembershipFee(
    orgSlug: string,
    data: { name: string; amount: number; due_date?: string }
) {
    try {
        // PATTERN 1: Verify org access with requireOrgAccess helper
        const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
        const supabase = await createClient()

        // PATTERN 2: Insert with server-verified orgId
        const { error } = await supabase
            .from('membership_fees')
            .insert({
                organization_id: orgId, // Server-verified, not from client
                name: data.name,
                amount: data.amount,
                due_date: data.due_date || null,
                is_active: true
            })

        if (error) {
            console.error('Error creating fee:', error)
            return { error: sanitizeError(error) }
        }

        revalidatePath(`/org/${orgSlug}/contingent`)
        return { success: true }
    } catch (error) {
        return { error: sanitizeError(error) }
    }
}

/**
 * SECURITY (M9): Standardized auth pattern for fetching membership fees
 */
export async function getMembershipFees(orgSlug: string): Promise<MembershipFee[]> {
    try {
        // PATTERN 1: Verify org access
        const { orgId } = await requireOrgAccess(orgSlug, 'org_member')
        const supabase = await createClient()

        // PATTERN 2: Query with server-verified orgId
        const { data, error } = await supabase
            .from('membership_fees')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching fees:', error)
            return []
        }

        return data as MembershipFee[]
    } catch (error) {
        console.error('Error in getMembershipFees:', error)
        return []
    }
}

/**
 * SECURITY (M9): Standardized auth pattern for toggling fee status
 */
export async function toggleFeeStatus(
    feeId: string,
    isActive: boolean,
    orgSlug: string
) {
    try {
        // PATTERN 1: Verify org access
        const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
        const supabase = await createClient()

        // PATTERN 2: Verify resource belongs to org before update
        const { data: fee } = await supabase
            .from('membership_fees')
            .select('organization_id')
            .eq('id', feeId)
            .single()

        if (!fee || fee.organization_id !== orgId) {
            return { error: 'Kontingent ikke funnet' }
        }

        // PATTERN 3: Update with server-verified orgId
        const { error } = await supabase
            .from('membership_fees')
            .update({ is_active: isActive })
            .eq('id', feeId)
            .eq('organization_id', orgId) // Double verification

        if (error) {
            console.error('Error toggling fee status:', error)
            return { error: sanitizeError(error) }
        }

        revalidatePath(`/org/${orgSlug}/contingent`)
        return { success: true }
    } catch (error) {
        return { error: sanitizeError(error) }
    }
}

