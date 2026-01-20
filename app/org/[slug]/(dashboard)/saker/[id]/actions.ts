'use server'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function getCase(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('case_items')
        .select(`
            *,
            meetings (
                id,
                title,
                meeting_date
            )
        `)
        .eq('id', id)
        .single()

    return data
}

export async function getCaseVotes(caseId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('case_votes')
        .select('*')
        .eq('case_id', caseId)
    return data || []
}

export async function getCaseComments(caseId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('case_comments')
        .select(`
            *,
            member:members(id, first_name, last_name, role)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true })
    return data || []
}

export async function castVote(caseId: string, vote: 'support' | 'oppose' | 'abstain') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Ikke innlogget' }

    // Find member ID for this org/user
    // 1. Get case -> org_id
    const { data: caseItem } = await supabase
        .from('case_items')
        .select('org_id, required_votes, status')
        .eq('id', caseId)
        .single()

    if (!caseItem) return { error: 'Sak ikke funnet' }
    if (caseItem.status !== 'open') return { error: 'Avstemning er ikke åpen' }

    // 2. Get member
    const { data: member } = await supabase
        .from('members')
        .select('id, role')
        .eq('organization_id', caseItem.org_id)
        .eq('user_id', user.id)
        .single()

    if (!member) return { error: 'Ingen medlemskap funnet' }
    if (!['admin', 'board', 'owner'].includes(member.role)) {
        return { error: 'Kun styret kan stemme' }
    }

    const { error } = await supabase
        .from('case_votes')
        .upsert({
            case_id: caseId,
            member_id: member.id,
            vote,
            updated_at: new Date().toISOString()
        }, { onConflict: 'case_id, member_id' })

    if (error) {
        console.error('Vote error:', error)
        return { error: 'Kunne ikke lagre stemme' }
    }

    revalidatePath(`/org/[slug]/saker/${caseId}`)
    return { success: true }
}

export async function addComment(caseId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Ikke innlogget' }

    // Find member ID for this org/user
    // 1. Get case -> org_id
    const { data: caseItem } = await supabase
        .from('case_items')
        .select('org_id')
        .eq('id', caseId)
        .single()

    if (!caseItem) return { error: 'Sak ikke funnet' }

    // 2. Get member
    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('organization_id', caseItem.org_id)
        .eq('user_id', user.id)
        .single()

    if (!member) return { error: 'Ingen medlemskap funnet' }

    const { error } = await supabase
        .from('case_comments')
        .insert({
            case_id: caseId,
            member_id: member.id,
            content
        })

    if (error) {
        console.error('Comment error:', error)
        return { error: 'Kunne ikke lagre kommentar' }
    }

    revalidatePath(`/org/[slug]/saker/${caseId}`)
    return { success: true }
}
