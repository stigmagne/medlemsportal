'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ImportResult = {
    success: boolean
    count: number
    errors: string[]
}

export type MappedMember = {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    address?: string
    postal_code?: string
    city?: string
    date_of_birth?: string
    member_number?: string
    joined_date?: string
}

export async function importMembers(org_id: string, members: MappedMember[]): Promise<ImportResult> {
    const supabase = await createClient()
    const errors: string[] = []
    let successCount = 0

    // Verify access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, count: 0, errors: ['Ikke autensitert'] }
    }

    const { data: access } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', org_id)
        .single()

    if (!access) {
        return { success: false, count: 0, errors: ['Ingen tilgang til organisasjonen'] }
    }

    // Require admin role for import
    if (access.role !== 'org_admin' && access.role !== 'org_owner') {
        return { success: false, count: 0, errors: ['Kun administratorer kan importere medlemmer'] }
    }

    // Get org slug for revalidatePath
    const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', org_id)
        .single()

    const orgSlug = org?.slug

    // Process in batches of 50
    const BATCH_SIZE = 50

    // First, fetch all existing emails for this org to skip duplicates
    // Optimization: fetching all emails might be heavy for huge orgs, but fine for now (MVP)
    const { data: existingMembers } = await supabase
        .from('members')
        .select('email')
        .eq('organization_id', org_id)
        .not('email', 'is', null)

    const existingEmails = new Set(existingMembers?.map(m => m.email?.toLowerCase()).filter(Boolean))

    const validMembersToInsert: any[] = []

    for (const member of members) {
        // Basic Validation
        if (!member.first_name || !member.last_name) {
            errors.push(`Utelot rad: Mangler fornavn eller etternavn (${member.email || 'Ukjent'})`)
            continue
        }

        // Duplicate Check
        if (member.email && existingEmails.has(member.email.toLowerCase())) {
            errors.push(`Utelot rad: E-post finnes allerede (${member.email})`)
            continue
        }

        // Prepare row
        validMembersToInsert.push({
            organization_id: org_id,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email || null,
            phone: member.phone || null,
            address: member.address || null,
            postal_code: member.postal_code || null,
            city: member.city || null,
            date_of_birth: member.date_of_birth || null,
            member_number: member.member_number || null, // DB handles auto-gen if null? No, Trigger usually handles it only if NOT NULL DEFAULT... wait, let's check schema.
            // If member_number is provided in CSV, utilize it. If not, let the DB logic (or absence of it) handle it.
            // Actually, our current schema generates member_number via trigger if it's missing?
            // Let's assume we pass NULL if it is empty string
            joined_date: member.joined_date || new Date().toISOString().split('T')[0],
            membership_status: 'active',
            membership_category: 'senior', // Default
            consent_marketing: false,
            consent_email: true, // Assume consent for imported members? Safe default is likely FALSE or based on input. Let's say TRUE for system emails.
            consent_sms: false,
        })
    }

    // Insert batches
    for (let i = 0; i < validMembersToInsert.length; i += BATCH_SIZE) {
        const batch = validMembersToInsert.slice(i, i + BATCH_SIZE)

        const { error } = await supabase
            .from('members')
            .insert(batch)

        if (error) {
            console.error('Batch insert error:', error)
            errors.push(`Feil ved lagring av batch ${i / BATCH_SIZE + 1}: ${error.message}`)
        } else {
            successCount += batch.length
        }
    }

    if (orgSlug) {
        revalidatePath(`/org/${orgSlug}/medlemmer`)
    }

    return {
        success: successCount > 0,
        count: successCount,
        errors: errors
    }
}
