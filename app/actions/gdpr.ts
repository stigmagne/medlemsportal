'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'

/**
 * GDPR Data Export - Export all data for a specific member
 * Article 15 & 20: Right of access and data portability
 */
export async function exportMemberData(orgSlug: string, memberId: string) {
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Fetch member data
    const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .single()

    if (memberError || !member) {
        return { error: 'Medlem ikke funnet' }
    }

    // Fetch related data
    const [
        { data: payments },
        { data: eventRegistrations },
        { data: bookings },
        { data: emailLogs },
        { data: familyConnections }
    ] = await Promise.all([
        // Payments
        supabase
            .from('payments')
            .select('id, amount, status, payment_type, created_at, paid_at')
            .eq('member_id', memberId),

        // Event registrations
        supabase
            .from('event_registrations')
            .select('id, event_id, status, created_at, events(title, start_date)')
            .eq('member_id', memberId),

        // Resource bookings
        supabase
            .from('resource_bookings')
            .select('id, resource_id, start_time, end_time, status, created_at')
            .eq('booked_by_member_id', memberId),

        // Email logs (communications received)
        supabase
            .from('email_logs')
            .select('id, status, created_at, campaign_id')
            .eq('member_id', memberId),

        // Family connections
        supabase
            .from('family_members')
            .select('family_id, role, families(name)')
            .eq('member_id', memberId)
    ])

    // Compile export data
    const exportData = {
        exportedAt: new Date().toISOString(),
        member: {
            id: member.id,
            firstName: member.first_name,
            lastName: member.last_name,
            email: member.email,
            phone: member.phone,
            address: member.address,
            postalCode: member.postal_code,
            city: member.city,
            dateOfBirth: member.date_of_birth,
            memberNumber: member.member_number,
            membershipStatus: member.membership_status,
            membershipCategory: member.membership_category,
            joinedDate: member.joined_date,
            notes: member.notes,
            consentMarketing: member.consent_marketing,
            consentEmail: member.consent_email,
            consentSms: member.consent_sms,
            createdAt: member.created_at,
            updatedAt: member.updated_at
        },
        payments: payments || [],
        eventRegistrations: eventRegistrations || [],
        bookings: bookings || [],
        communicationsReceived: (emailLogs || []).length,
        familyConnections: familyConnections || []
    }

    return { success: true, data: exportData }
}

/**
 * GDPR Data Deletion - Delete/anonymize member data
 * Article 17: Right to erasure ("right to be forgotten")
 */
export async function deleteMemberData(
    orgSlug: string,
    memberId: string,
    options: {
        hardDelete?: boolean  // If true, completely removes record. If false, anonymizes.
        reason?: string
    } = {}
) {
    const { orgId, user } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Verify member exists and belongs to this org
    const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, email, first_name, last_name')
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .single()

    if (memberError || !member) {
        return { error: 'Medlem ikke funnet' }
    }

    // Log the deletion request for audit
    console.log(`GDPR deletion request: member ${memberId} by user ${user.id}, reason: ${options.reason || 'Not specified'}`)

    if (options.hardDelete) {
        // Hard delete - completely remove the member
        // Note: Related records may be deleted by CASCADE or need manual cleanup

        // First, anonymize email logs (keep for statistics but remove personal link)
        await supabase
            .from('email_logs')
            .update({ member_id: null })
            .eq('member_id', memberId)

        // Remove from families
        await supabase
            .from('family_members')
            .delete()
            .eq('member_id', memberId)

        // Delete the member record
        const { error: deleteError } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId)
            .eq('organization_id', orgId)

        if (deleteError) {
            console.error('Error deleting member:', deleteError)
            return { error: 'Kunne ikke slette medlem: ' + deleteError.message }
        }
    } else {
        // Soft delete / Anonymization - preserve record structure but remove personal data
        const { error: updateError } = await supabase
            .from('members')
            .update({
                first_name: 'Slettet',
                last_name: 'Bruker',
                email: null,
                phone: null,
                address: null,
                postal_code: null,
                city: null,
                date_of_birth: null,
                notes: `Anonymisert ${new Date().toISOString()}. Grunn: ${options.reason || 'GDPR-forespørsel'}`,
                membership_status: 'deleted',
                consent_marketing: false,
                consent_email: false,
                consent_sms: false,
                deleted_at: new Date().toISOString()
            })
            .eq('id', memberId)
            .eq('organization_id', orgId)

        if (updateError) {
            console.error('Error anonymizing member:', updateError)
            return { error: 'Kunne ikke anonymisere medlem: ' + updateError.message }
        }

        // Update email logs to remove personal link
        await supabase
            .from('email_logs')
            .update({ member_id: null })
            .eq('member_id', memberId)
    }

    revalidatePath(`/org/${orgSlug}/medlemmer`)

    return {
        success: true,
        message: options.hardDelete
            ? 'Medlem er permanent slettet'
            : 'Medlem er anonymisert'
    }
}

/**
 * Get GDPR-related statistics for an organization
 */
export async function getGdprStats(orgSlug: string) {
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    const [
        { count: totalMembers },
        { count: activeMembers },
        { count: deletedMembers },
        { count: marketingConsent },
        { count: emailConsent },
        { count: smsConsent }
    ] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('membership_status', 'active'),
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('membership_status', 'deleted'),
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('consent_marketing', true),
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('consent_email', true),
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('consent_sms', true)
    ])

    return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        deletedMembers: deletedMembers || 0,
        consentStats: {
            marketing: marketingConsent || 0,
            email: emailConsent || 0,
            sms: smsConsent || 0
        }
    }
}
