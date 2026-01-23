'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getUpcomingMeetings(slug: string) {
    const supabase = await createClient()

    // Get org id
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) return []

    const { data } = await supabase
        .from('meetings')
        .select('id, title, meeting_date')
        .eq('org_id', org.id)
        .gte('meeting_date', new Date().toISOString())
        .eq('status', 'planned')
        .order('meeting_date', { ascending: true })

    return data || []
}

export async function createCase(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const slug = formData.get('orgSlug') as string
    const type = formData.get('type') as 'meeting' | 'email'
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const attachmentUrl = formData.get('attachmentUrl') as string
    const meetingId = formData.get('meetingId') as string
    const decision = formData.get('decision') as string

    // Auth & Org Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Ikke innlogget' }

    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) return { error: 'Fant ikke organisasjon' }

    const votingEnabled = formData.get('votingEnabled') === 'on'
    const votingDeadline = formData.get('votingDeadline') as string

    // 1. Get Next Case Number & Org ID (Atomic)
    const { data: numData, error: numError } = await supabase
        .rpc('get_next_case_number', { p_org_id: org.id })

    if (numError || !numData) {
        console.error('Numbering error:', numError)
        return { error: 'Kunne ikke generere saksnummer' }
    }

    const { formatted, year, number } = numData as any

    // Calculate required votes (Simple majority of board/admins)
    let requiredVotes = null
    if (votingEnabled) {
        // Count board members
        const { count, error: countError } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .in('role', ['admin', 'owner', 'board']) // Consistent with invites

        if (!countError && count) {
            requiredVotes = Math.floor(count / 2) + 1
        } else {
            requiredVotes = 1 // Fallback
        }
    }

    // 2. Prepare Insert Data
    const insertData: any = {
        org_id: org.id,
        meeting_id: type === 'meeting' && meetingId ? meetingId : null,
        title,
        description,
        case_year: year,
        case_number: number,
        formatted_id: formatted,
        origin: type,
        // Status: If voting, set to 'open' (under behandling). If email without voting, 'decided'.
        status: votingEnabled ? 'open' : (type === 'email' ? 'decided' : 'draft'),
        created_by: user.id,
        attachments: attachmentUrl ? [{ type: 'link', url: attachmentUrl, name: 'Vedlegg' }] : [],
        voting_enabled: votingEnabled,
        voting_deadline: votingDeadline ? new Date(votingDeadline).toISOString() : null,
        required_votes: requiredVotes
    }

    // Add decision info if email case AND NOT voting (legacy instant decision)
    if (type === 'email' && !votingEnabled) {
        insertData.decision = decision
        insertData.decision_type = 'remote_email'
        insertData.decided_at = new Date().toISOString()
    }

    // 3. Insert Case
    const { data: newCase, error: insertError } = await supabase
        .from('case_items')
        .insert(insertData)
        .select()
        .single()

    if (insertError) {
        console.error('Create case error:', insertError)
        return { error: 'Kunne ikke opprette sak' }
    }

    revalidatePath(`/org/${slug}/saker`)
    redirect(`/org/${slug}/saker/${newCase.id}`)
}
