'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeHTML } from '@/lib/validations/schemas'

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

    // SECURITY: Sanitize HTML content to prevent XSS attacks
    const sanitizedNotes = content.notes ? sanitizeHTML(content.notes) : ''
    const sanitizedDecisions = Array.isArray(content.decisions)
        ? content.decisions.map((d: any) => ({
            ...d,
            text: sanitizeHTML(d.text || '')
        }))
        : []
    const sanitizedActions = Array.isArray(content.actions)
        ? content.actions.map((a: any) => ({
            ...a,
            text: sanitizeHTML(a.text || '')
        }))
        : []

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
                content: sanitizedNotes,
                decisions: sanitizedDecisions,
                action_items: sanitizedActions,
                updated_at: new Date().toISOString()
            })
            .eq('meeting_id', meetingId)

        if (error) return { error: 'Kunne ikke lagre referat' }
    } else {
        const { error } = await supabase
            .from('meeting_minutes')
            .insert({
                meeting_id: meetingId,
                content: sanitizedNotes,
                decisions: sanitizedDecisions,
                action_items: sanitizedActions,
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
