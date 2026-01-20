'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMinutes(meetingId: string) {
    const supabase = await createClient()

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

export async function saveMinutes(meetingId: string, content: any, decisions: any[]) {
    const supabase = await createClient()

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

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
