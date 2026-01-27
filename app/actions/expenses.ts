'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { encryptBankAccount } from '@/lib/crypto/bank-encryption'

interface SubmitExpenseInput {
    org_id: string;
    event_id?: string;
    description: string;
    travel_date: string;
    transport_type: 'car' | 'public' | 'flight' | 'other';
    start_location?: string;
    end_location?: string;
    distance_km?: number;
    toll_parking_cost?: number;
    ticket_cost?: number;
    receipt_url?: string; // Path/URL from storage
    bank_account: string; // Encrypted before storage for GDPR compliance
}

export async function submitExpenses(items: SubmitExpenseInput[]) {
    const supabase = await createClient()

    // Get current user member_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Du må være logget inn' }

    // Get member (assume same org for all items, check first item)
    if (items.length === 0) return { error: 'Ingen utlegg å sende inn' }
    const orgId = items[0].org_id

    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single()

    if (!member) return { error: 'Fant ikke medlemskap' }

    const KM_RATE = 3.50

    // Prepare rows with bank account encryption
    const rows = await Promise.all(items.map(async data => {
        let total = 0
        if (data.transport_type === 'car' && data.distance_km) {
            total += data.distance_km * KM_RATE
        }
        if (data.toll_parking_cost) total += data.toll_parking_cost
        if (data.ticket_cost) total += data.ticket_cost

        // Encrypt bank account before storage (GDPR compliance)
        const encryptedBankAccount = await encryptBankAccount(data.bank_account)

        return {
            org_id: data.org_id,
            member_id: member.id,
            event_id: data.event_id || null,
            description: data.description,
            travel_date: data.travel_date,
            transport_type: data.transport_type,
            start_location: data.start_location,
            end_location: data.end_location,
            distance_km: data.distance_km,
            toll_parking_cost: data.toll_parking_cost,
            ticket_cost: data.ticket_cost,
            total_amount: total,
            receipt_url: data.receipt_url,
            bank_account: encryptedBankAccount,
            status: 'submitted'
        }
    }))

    const { error } = await supabase
        .from('travel_expenses')
        .insert(rows)

    if (error) {
        console.error('Error submitting expenses:', error)
        return { error: 'Kunne ikke sende inn reiseregning' }
    }

    revalidatePath(`/org/${orgId}/minside/utlegg`)
    return { success: true }
}

export async function getMemberExpenses(orgId: string) {
    const supabase = await createClient()

    // Get current user member_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single()

    if (!member) return []

    const { data: expenses } = await supabase
        .from('travel_expenses')
        .select('*, event:events(title)')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

    return expenses || []
}

// Admin Actions

export async function getExpensesForAdmin(orgSlug: string, status: 'submitted' | 'approved' | 'rejected' | 'paid' | 'all' = 'all') {
    // SECURITY: Require admin access before viewing all expenses
    const { requireOrgAccess } = await import('@/lib/auth/helpers')
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    let query = supabase
        .from('travel_expenses')
        .select(`
            *,
            member:members(first_name, last_name, email),
            event:events(title)
        `)
        .eq('org_id', orgId) // Server-verified orgId
        .order('created_at', { ascending: false })

    if (status !== 'all') {
        query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching admin expenses:', error)
        return []
    }

    return data
}

export async function updateExpenseStatus(
    expenseId: string,
    status: 'approved' | 'rejected' | 'paid',
    rejectionReason?: string
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const updateData: any = {
        status,
        updated_at: new Date().toISOString()
    }

    if (status === 'approved') {
        updateData.approved_by = user?.id
        updateData.approved_at = new Date().toISOString()
    }

    if (status === 'paid') {
        updateData.paid_at = new Date().toISOString()
    }

    if (status === 'rejected') {
        updateData.rejection_reason = rejectionReason
    }

    const { error } = await supabase
        .from('travel_expenses')
        .update(updateData)
        .eq('id', expenseId)

    if (error) {
        return { error: 'Kunne ikke oppdatere status' }
    }

    // Determine orgId to revalidate path 
    // In a real app we might fetch it, but here we might rely on the client refreshing or 
    // revalidating a generic tag. 
    // For now, return success.

    return { success: true }
}
