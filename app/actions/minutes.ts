'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireOrgAccess } from '@/lib/auth/helpers'

export type MeetingDecision = {
    id: string
    text: string
}

export type TiptapContent = Record<string, any>


export async function getMinutes(meetingId: string, orgSlug: string) {
    // SECURITY: Verify org access
    const { orgId } = await requireOrgAccess(orgSlug, 'org_member')

    const supabase = await createClient()

    // SECURITY: Verify meeting belongs to this org
    const { data: meeting } = await supabase
        .from('meetings')
        .select('org_id')
        .eq('id', meetingId)
        .single()

    if (!meeting || meeting.org_id !== orgId) {
        throw new Error('Meeting not found or access denied')
    }

    const { data, error } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('meeting_id', meetingId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching minutes:', error)
    }

    return data
}

export async function saveMinutes(meetingId: string, content: TiptapContent, decisions: MeetingDecision[], orgSlug: string) {
    // SECURITY: Verify org access
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    // SECURITY: Verify meeting belongs to this org
    const { data: meeting } = await supabase
        .from('meetings')
        .select('org_id')
        .eq('id', meetingId)
        .single()

    if (!meeting || meeting.org_id !== orgId) {
        return { error: 'Meeting not found or access denied' }
    }

    // Check if exists
    const { data: existing } = await supabase
        .from('meeting_minutes')
        .select('id')
        .eq('meeting_id', meetingId)
        .single()

    if (existing) {
        const { error } = await supabase
            .from('meeting_minutes')
            .update({
                content,
                decisions,
                updated_at: new Date().toISOString()
            })
            .eq('meeting_id', meetingId)

        if (error) return { error: error.message }
    } else {
        const { error } = await supabase
            .from('meeting_minutes')
            .insert({
                meeting_id: meetingId,
                content,
                decisions,
                status: 'draft'
            })

        if (error) return { error: error.message }
    }

    revalidatePath(`/org/[slug]/moter/${meetingId}`)
    return { success: true }
}

export async function publishMinutes(meetingId: string, slug: string) {
    // SECURITY: Verify org access - publishing minutes requires admin
    const { orgId } = await requireOrgAccess(slug, 'org_admin')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // SECURITY: Verify meeting belongs to this org
    const { data: meeting } = await supabase
        .from('meetings')
        .select('org_id')
        .eq('id', meetingId)
        .single()

    if (!meeting || meeting.org_id !== orgId) {
        return { error: 'Meeting not found or access denied' }
    }

    // 1. Get attendee snapshot
    const { data: attendees } = await supabase
        .from('meeting_attendees')
        .select('member:members(first_name, last_name, email), rsvp_status, attended')
        .eq('meeting_id', meetingId)

    // 2. Update minutes status and save snapshot
    const { error } = await supabase
        .from('meeting_minutes')
        .update({
            status: 'published',
            attendees_list: attendees,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        })
        .eq('meeting_id', meetingId)

    if (error) return { error: error.message }

    // 3. Mark meeting as completed
    await supabase
        .from('meetings')
        .update({ status: 'completed' })
        .eq('id', meetingId)

    revalidatePath(`/org/${slug}/moter/${meetingId}`)
    return { success: true }
}
