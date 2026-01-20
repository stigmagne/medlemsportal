'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type MinuteItem = {
    id: string
    text: string
    completed?: boolean // for action items
    assignee?: string // for action items
}

export async function getMinutes(meetingId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('meeting_id', meetingId)
        .single()
    return data
}

export async function saveMinutes(meetingId: string, content: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Ikke innlogget' }

    // Check if minutes exist, if not create
    const { data: existing } = await supabase
        .from('meeting_minutes')
        .select('id')
        .eq('meeting_id', meetingId)
        .single()

    if (existing) {
        const { error } = await supabase
            .from('meeting_minutes')
            .update({
                content: content.notes, // simple text for now
                decisions: content.decisions,
                action_items: content.actions,
                updated_at: new Date().toISOString()
            })
            .eq('meeting_id', meetingId)

        if (error) return { error: 'Kunne ikke lagre referat' }
    } else {
        const { error } = await supabase
            .from('meeting_minutes')
            .insert({
                meeting_id: meetingId,
                content: content.notes,
                decisions: content.decisions,
                action_items: content.actions,
                created_at: new Date().toISOString()
            })

        if (error) return { error: 'Kunne ikke opprette referat' }
    }

    revalidatePath(`/org/[slug]/moter/${meetingId}`) // revalidate generic path? No slug available here easily without passing it.
    // Ideally we pass slug. For now we rely on client refresh or revalidatePath if we had slug.
    return { success: true }
}

export async function publishMinutes(meetingId: string) {
    const supabase = await createClient()
    // Set status to approved/published
    const { error } = await supabase
        .from('meeting_minutes')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('meeting_id', meetingId)

    if (error) return { error: 'Kunne ikke publisere' }
    return { success: true }
}
