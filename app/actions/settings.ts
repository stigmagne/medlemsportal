'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess, requireRole } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'
import { generateKid, generateNumericReference } from '@/lib/invoicing/kid'

export async function updateOrganizationSettings(orgSlug: string, data: { membershipFee?: number, accountNumber?: string, contactEmail?: string }) {
    // SECURITY: Require admin access
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Prepare updates object
    const updates: any = {}
    if (data.membershipFee !== undefined) updates.membership_fee = data.membershipFee
    if (data.accountNumber !== undefined) updates.account_number = data.accountNumber
    if (data.contactEmail !== undefined) updates.contact_email = data.contactEmail

    const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)  // Server-verified orgId (IDOR FIX)

    if (error) {
        console.error('Error updating settings:', error)
        return { error: 'Kunne ikke oppdatere innstillinger' }
    }

    // Utled slug fra orgId for revalidation
    const { data: org } = await supabase.from('organizations').select('slug').eq('id', orgId).single()
    if (org?.slug) {
        revalidatePath(`/org/${org.slug}/innstillinger`)
    }
    return { success: true }
}

export async function runNewYearRenewal(orgSlug: string, year: number) {
    // SECURITY: CRITICAL - Require superadmin for this system-wide financial operation
    await requireRole('superadmin')

    // Utled orgId fra slug
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // 1. Get Organization Details (Fee)
    const { data: org } = await supabase
        .from('organizations')
        .select('membership_fee, slug')
        .eq('id', orgId)
        .single()

    if (!org || !org.membership_fee) {
        return { error: 'Kontingent er ikke satt for denne organisasjonen' }
    }

    const fee = org.membership_fee

    // 1b. Invalidate OLD pending invoices (from previous years)
    // User requested: "Ubetalte fakturaer ugyldige... og merket med ubetalt år"
    const startOfYear = `${year}-01-01T00:00:00.000Z`

    // First, find who we are cancelling so we can tag them
    const { data: pendingTransactions } = await supabase
        .from('payment_transactions')
        .select('member_id, description, created_at')
        .eq('org_id', orgId)
        .eq('type', 'membership_fee')
        .eq('status', 'pending')
        .lt('created_at', startOfYear)

    if (pendingTransactions && pendingTransactions.length > 0) {
        // Map member -> years to add
        const memberUnpaidMap = new Map<string, Set<number>>()

        for (const tx of pendingTransactions) {
            // Try to extract year from description "Medlemskontingent 2025..."
            const match = tx.description?.match(/Contingent|Kontingent.*?(\d{4})/)
            let txYear = match ? parseInt(match[1]) : new Date(tx.created_at).getFullYear()

            if (!memberUnpaidMap.has(tx.member_id)) {
                memberUnpaidMap.set(tx.member_id, new Set())
            }
            memberUnpaidMap.get(tx.member_id)?.add(txYear)
        }

        // Update members - this is a bit heavy if many members, but robust.
        // We can optimize with a stored procedure later if needed.
        for (const [memberId, years] of memberUnpaidMap.entries()) {
            const yearsArray = Array.from(years)
            // We need to fetch current array first to avoid overwriting or duplicates? 
            // Or use an RPC. "array_distinct(array_cat(unpaid_years, new_years))"
            // Simple approach: Fetch, Merge, Update.
            const { data: member } = await supabase.from('members').select('unpaid_years').eq('id', memberId).single()
            const current = member?.unpaid_years || []
            const updated = Array.from(new Set([...current, ...yearsArray])).sort()

            await supabase.from('members').update({ unpaid_years: updated }).eq('id', memberId)
        }
    }

    // Now cancel them
    await supabase
        .from('payment_transactions')
        .update({ status: 'cancelled' })
        .eq('org_id', orgId)
        .eq('type', 'membership_fee')
        .eq('status', 'pending')
        .lt('created_at', startOfYear)

    // 1c. Update Organization Subscription (Platform Fee)
    // Trigger "New Year" for the organization's own debt to the platform.
    const { data: currentOrg } = await supabase
        .from('organizations')
        .select('subscription_year, subscription_plan')
        .eq('id', orgId)
        .single()

    if (currentOrg && currentOrg.subscription_year !== year) {
        // Fetch plan price
        const { data: plan } = await supabase
            .from('subscription_plans')
            .select('price')
            .eq('name', currentOrg.subscription_plan || 'Årsabonnement')
            .single()

        const planPrice = plan ? plan.price : 990

        // Reset balance to full plan price and update year
        await supabase
            .from('organizations')
            .update({
                subscription_balance: planPrice,
                subscription_year: year,
                subscription_status: 'pending' // Set to pending until paid
            })
            .eq('id', orgId)
    }

    revalidatePath(`/org/${org.slug}/betalinger`)
    revalidatePath(`/org/${org.slug}/innstillinger`)

    // 2. Get Active Members with their type and fee
    // Note: We join with member_types to get the specific fee for each member
    const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
            id,
            first_name,
            last_name,
            member_type_id,
            member_types (
                fee,
                name
            )
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null) // Only active members
        .neq('membership_status', 'inactive') // Exclude explicitly inactive

    if (membersError) {
        console.error('Renewal Error fetching members:', membersError)
        return { error: `Kunne ikke hente medlemmer: ${membersError.message}` }
    }
    if (!members || members.length === 0) return { error: 'Ingen aktive medlemmer funnet' }

    // 2a. Check for EXISTING transactions for this year to avoid duplicates
    const { data: existingTransactions } = await supabase
        .from('payment_transactions')
        .select('member_id')
        .eq('org_id', orgId)
        .eq('type', 'membership_fee')
        .ilike('description', `%${year}%`)

    const existingMemberIds = new Set(existingTransactions?.map(t => t.member_id) || [])

    // 3. Create Payment Transactions (Invoices)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14) // 14 days due date

    const transactions = members
        .filter(member => !existingMemberIds.has(member.id)) // Skip if already has invoice
        .map(member => {
            // Determine fee: Use member type fee if available, otherwise org default fee
            // @ts-ignore - Supabase types join handling
            const typeFee = member.member_types?.fee
            // @ts-ignore
            const typeName = member.member_types?.name

            const amount = typeFee !== undefined ? typeFee : fee

            // Generate unique KID number for each invoice
            const reference = generateNumericReference()
            const kid = generateKid(reference)

            return {
                org_id: orgId,
                member_id: member.id,
                amount: amount,
                type: 'membership_fee',
                description: `Medlemskontingent ${year}${typeName ? ` - ${typeName}` : ''}`,
                status: 'pending',
                due_date: dueDate.toISOString(),
                kid: kid,
                payment_method: 'invoice',
                created_at: new Date().toISOString()
            }
        })

    if (transactions.length === 0) {
        return { success: true, count: 0, message: 'Alle medlemmer har allerede faktura for dette året.' }
    }

    const { error: insertError } = await supabase
        .from('payment_transactions')
        .insert(transactions)

    if (insertError) {
        console.error('Error creating renewal transactions:', insertError)
        return { error: `Kunne ikke generere fakturaer: ${insertError.message}` }
    }

    revalidatePath(`/org/${org.slug}/betalinger`)
    return { success: true, count: transactions.length }
}

export async function getOrgSettings(orgSlug: string) {
    // SECURITY: Require at least member access
    const { orgId } = await requireOrgAccess(orgSlug, 'org_member')
    const supabase = await createClient()
    const { data } = await supabase
        .from('organizations')
        .select('membership_fee, account_number, contact_email')
        .eq('id', orgId)
        .single()
    return data
}
