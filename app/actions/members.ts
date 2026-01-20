'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateMemberInput = {
    organization_id: string
    member_number: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    date_of_birth: string | null
    address: string | null
    postal_code: string | null
    city: string | null
    membership_category: string
    member_type_id: string | null
    membership_status: string
    joined_date: string
    consent_email: boolean
    consent_sms: boolean
    consent_marketing: boolean
    consent_date: string | null
    notes: string | null
    slug: string // passed for revalidation
}

export async function createMember(data: CreateMemberInput) {
    const supabase = await createClient()
    const year = new Date().getFullYear()

    // 1. Insert Member
    const { data: member, error: insertError } = await supabase
        .from('members')
        .insert({
            organization_id: data.organization_id,
            member_number: data.member_number,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            date_of_birth: data.date_of_birth,
            address: data.address,
            postal_code: data.postal_code,
            city: data.city,
            membership_category: data.membership_category,
            member_type_id: data.member_type_id,
            membership_status: data.membership_status,
            joined_date: data.joined_date,
            consent_email: data.consent_email,
            consent_sms: data.consent_sms,
            consent_marketing: data.consent_marketing,
            consent_date: data.consent_date,
            notes: data.notes
        })
        .select()
        .single()

    if (insertError) {
        console.error('Error creating member:', insertError)
        return { error: 'Kunne ikke opprette medlem' }
    }

    // 2. Check if we should generate an invoice (if renewal has run for this year)
    // We check if there are ANY membership_fee transactions for this org for the current year
    const { count, error: countError } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', data.organization_id)
        .eq('type', 'membership_fee')
        .ilike('description', `%${year}%`)

    if (countError) {
        console.error('Error checking for existing renewal:', countError)
        // We continue, but maybe log a warning. We don't want to fail member creation just because of this check?
        // But if we fail here, the member is created but no invoice. That's acceptable fallback.
    }

    if (count && count > 0 && data.member_type_id) {
        // Renewal has run, so we should generate an invoice for this new member

        // Fetch the specific fee for this member type
        // Note: data.membership_category might be the name, but we want the actual fee.
        // We could query member_types table.
        const { data: memberType } = await supabase
            .from('member_types')
            .select('fee, name')
            .eq('id', data.member_type_id)
            .single()

        // Fallback fee? If we can't find type, we might look up org default, 
        // but for now let's rely on memberType being found since ID is provided.
        if (memberType) {
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 14) // 14 days due date

            const { error: invoiceError } = await supabase
                .from('payment_transactions')
                .insert({
                    org_id: data.organization_id,
                    member_id: member.id,
                    amount: memberType.fee,
                    type: 'membership_fee',
                    description: `Medlemskontingent ${year} - ${memberType.name}`,
                    status: 'pending',
                    due_date: dueDate.toISOString(),
                })

            if (invoiceError) {
                console.error('Error generating automatic invoice:', invoiceError)
                return { success: true, warning: 'Medlem opprettet, men kunne ikke generere faktura automatisk.' }
            }
        }
    }

    revalidatePath(`/org/${data.slug}/medlemmer`)
    return { success: true }
}
