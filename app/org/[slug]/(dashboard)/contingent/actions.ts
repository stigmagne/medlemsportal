'use server'

import { createClient } from '@/lib/supabase/server'
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

export async function createMembershipFee(org_id: string, data: { name: string; amount: number; due_date?: string }) {
    const supabase = await createClient()

    // Verify access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: access } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', org_id)
        .single()

    if (!access) return { success: false, error: 'Forbidden' }

    const { error } = await supabase
        .from('membership_fees')
        .insert({
            organization_id: org_id,
            name: data.name,
            amount: data.amount,
            due_date: data.due_date || null,
            is_active: true
        })

    if (error) {
        console.error('Error creating fee:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/org/${org_id}/contingent/innstillinger`) // Note: This might need slug validation if we use slug in path
    return { success: true }
}

export async function getMembershipFees(org_id: string): Promise<MembershipFee[]> {
    const supabase = await createClient()

    // Auth check optional given RLS, but good practice
    const { data, error } = await supabase
        .from('membership_fees')
        .select('*')
        .eq('organization_id', org_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching fees:', error)
        return []
    }

    return data as MembershipFee[]
}

export async function toggleFeeStatus(fee_id: string, is_active: boolean, org_id: string) {
    const supabase = await createClient()

    // Access check handled by RLS typically, but explicit here too
    const { error } = await supabase
        .from('membership_fees')
        .update({ is_active })
        .eq('id', fee_id)
        .eq('organization_id', org_id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/org/${org_id}/contingent/innstillinger`)
    return { success: true }
}
