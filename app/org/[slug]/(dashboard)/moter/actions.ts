'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type Meeting = {
    id: string
    title: string
    description?: string
    meeting_date: string
    meeting_type: string
    location?: string
    status: string
    attendees_count?: number
}

export async function getMeetings(slug: string) {
    // SECURITY: Require at least member access to view meetings
    const { requireOrgAccess } = await import('@/lib/auth/helpers')
    const { orgId } = await requireOrgAccess(slug, 'org_member')

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('org_id', orgId) // Server-verified orgId
        .order('meeting_date', { ascending: true })

    if (error) {
        console.error('getMeetings Error details:', JSON.stringify(error, null, 2))
        throw error
    }
    return data as Meeting[]
}

export async function createMeeting(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // Defensive handling for argument mismatch (e.g. if called directly without useFormState wrapper behaving as expected)
    if (!formData && prevState instanceof FormData) {
        formData = prevState
        prevState = {}
    }

    if (!formData) {
        return { error: 'Systemfeil: Manglendejem skjemadata (formData er undefined)' }
    }

    const slug = formData.get('orgSlug') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const type = formData.get('type') as string
    const location = formData.get('location') as string
    // Handle case selection (can be multiple with same name)
    const caseIds = formData.getAll('caseIds') as string[]

    // Combine date and time
    const meetingDateTime = new Date(`${date}T${time}`).toISOString()

    // Get org id
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) return { error: 'Fant ikke organisasjon' }

    // User auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Ikke innlogget' }

    const { data: meeting, error } = await supabase
        .from('meetings')
        .insert({
            org_id: org.id,
            title,
            description,
            meeting_date: meetingDateTime,
            meeting_type: type,
            location,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Create meeting error:', error)
        return { error: 'Kunne ikke opprette møte' }
    }

    // Link selected cases to this meeting
    if (caseIds.length > 0) {
        const { error: linkError } = await supabase
            .from('case_items')
            .update({ meeting_id: meeting.id })
            .in('id', caseIds)

        if (linkError) {
            console.error('Error linking cases:', linkError)
            // Non-critical, but should be noted. We redirect anyway.
        }
    }

    revalidatePath(`/org/${slug}/moter`)
    redirect(`/org/${slug}/moter/${meeting.id}`)
}



export async function getOpenCases(slug: string) {
    const supabase = await createClient()

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) return []

    // Fetch cases that are open/draft AND not connected to a meeting yet
    // origin = 'meeting' ensures we don't pick up pure email decisions unless they are converted?
    // User wants to add "saker" to meeting. Even email cases might be brought up?
    // Let's assume origin='meeting' OR origin is null?
    // Safer to just check connected_meeting_id is null and status is not decided/dismissed
    const { data } = await supabase
        .from('case_items')
        .select('id, title, formatted_id, created_at')
        .eq('org_id', org.id)
        .is('meeting_id', null)
        .neq('status', 'decided')
        .neq('status', 'dismissed')
        .order('created_at', { ascending: false })

    return data || []
}

export async function inviteMembers(meetingId: string, slug: string, group: 'board' | 'all') {
    const supabase = await createClient()

    // Get org id
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) return { error: 'Fant ikke organisasjon' }

    // Fetch members based on group
    let query = supabase.from('members').select('id, email').eq('organization_id', org.id)

    if (group === 'board') {
        // Assuming 'role' or a specific attribute defines board. 
        // For MVP we might checking a role 'admin' or 'board_member'
        // Let's assume 'role' in members table determines this, or valid roles are 'admin'/'owner'
        // Adjust this filter based on your actual member roles
        query = query.in('role', ['admin', 'owner', 'board'])
    }

    const { data: members, error: memberError } = await query

    if (memberError || !members || members.length === 0) {
        return { error: 'Fant ingen medlemmer å invitere' }
    }

    // Insert into meeting_attendees (ignore duplicates)
    const attendees = members.map(m => ({
        meeting_id: meetingId,
        member_id: m.id,
        rsvp_status: 'pending'
    }))

    const { error: insertError } = await supabase
        .from('meeting_attendees')
        .upsert(attendees, { onConflict: 'meeting_id, member_id', ignoreDuplicates: true })

    if (insertError) {
        console.error('Invite error:', insertError)
        return { error: 'Kunne ikke legge til deltakere' }
    }

    revalidatePath(`/org/${slug}/moter/${meetingId}`)
    return { success: true, count: members.length }
}

export async function updateRsvp(meetingId: string, slug: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Ikke innlogget' }

    // Find member record for this user in this context (we need member_id)
    // We can look up via meeting_attendees directly if we joined tables, 
    // but safer to find member_id first.
    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single() // Assumption: user is member of the org context implied by meeting

    if (!member) return { error: 'Fant ikke medlemsprofil' }

    const { error } = await supabase
        .from('meeting_attendees')
        .update({
            rsvp_status: status,
            rsvp_date: new Date().toISOString()
        })
        .eq('meeting_id', meetingId)
        .eq('member_id', member.id)

    if (error) {
        console.error('RSVP error:', error)
        return { error: 'Kunne ikke oppdatere status' }
    }

    revalidatePath(`/org/${slug}/moter/${meetingId}`)
    return { success: true }
}

// Mock function for sending emails for now
export async function sendMeetingInvitation(meetingId: string, slug: string) {
    // In a real implementation:
    // 1. Fetch meeting details
    // 2. Fetch all attendees with 'pending' status
    // 3. Loop and send emails via Resend

    // For MVP/Demo:
    return { success: true, message: 'Invitations queued (Mock)' }
}
