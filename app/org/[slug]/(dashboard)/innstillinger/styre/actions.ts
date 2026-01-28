'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const BoardPositionSchema = z.object({
    member_id: z.string().uuid(),
    position_type: z.enum(['leder', 'nestleder', 'kasserer', 'sekretar', 'medlem', 'varamedlem', 'revisor']),
    position_title: z.string().optional(),
    elected_date: z.string(),
    term_start_date: z.string(),
    term_end_date: z.string().optional().nullable(),
    term_years: z.coerce.number().int().min(1).default(2),
    public_email: z.string().email().optional().or(z.literal('')),
    public_phone: z.string().optional(),
    bio: z.string().optional(),
    election_protocol_url: z.string().optional(),
})

export async function createBoardPosition(orgSlug: string, prevState: any, formData: FormData) {
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Parse form data
    const rawData = {
        member_id: formData.get('member_id'),
        position_type: formData.get('position_type'),
        position_title: formData.get('position_title'),
        elected_date: formData.get('elected_date'),
        term_start_date: formData.get('term_start_date'),
        term_end_date: formData.get('term_end_date'),
        term_years: formData.get('term_years'),
        public_email: formData.get('public_email'),
        public_phone: formData.get('public_phone'),
        bio: formData.get('bio'),
        election_protocol_url: formData.get('election_protocol_url'),
    }

    // Handle optional empty strings
    // @ts-ignore
    if (rawData.term_end_date === '') rawData.term_end_date = null
    // @ts-ignore
    if (rawData.public_email === '') rawData.public_email = undefined
    // @ts-ignore
    if (rawData.public_phone === '') rawData.public_phone = undefined
    // @ts-ignore
    if (rawData.bio === '') rawData.bio = undefined

    const validated = BoardPositionSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Validation failed', errors: validated.error.flatten().fieldErrors }
    }

    const { error } = await supabase.from('board_positions').insert({
        organization_id: orgId,
        ...validated.data,
        term_end_date: validated.data.term_end_date || null
    })

    if (error) {
        console.error('Board creation error:', error)
        return { error: 'Kunne ikke opprette styreverv. Sjekk at medlemet ikke allerede har dette vervet for denne perioden.' }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger/styre`)
    revalidatePath(`/org/${orgSlug}/styre`)
    return { success: true }
}

export async function updateBoardPosition(orgSlug: string, positionId: string, prevState: any, formData: FormData) {
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    const rawData = {
        member_id: formData.get('member_id'),
        position_type: formData.get('position_type'),
        position_title: formData.get('position_title'),
        elected_date: formData.get('elected_date'),
        term_start_date: formData.get('term_start_date'),
        term_end_date: formData.get('term_end_date'),
        term_years: formData.get('term_years'),
        public_email: formData.get('public_email'),
        public_phone: formData.get('public_phone'),
        bio: formData.get('bio'),
        election_protocol_url: formData.get('election_protocol_url'),
    }

    // Handle optional empty strings
    // @ts-ignore
    if (rawData.term_end_date === '') rawData.term_end_date = null
    // @ts-ignore
    if (rawData.public_email === '') rawData.public_email = undefined
    // @ts-ignore
    if (rawData.public_phone === '') rawData.public_phone = undefined
    // @ts-ignore
    if (rawData.bio === '') rawData.bio = undefined

    const validated = BoardPositionSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Validation failed', errors: validated.error.flatten().fieldErrors }
    }

    const { error } = await supabase.from('board_positions')
        .update({
            ...validated.data,
            term_end_date: validated.data.term_end_date || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', positionId)
        .eq('organization_id', orgId)

    if (error) {
        console.error('Board update error:', error)
        return { error: 'Kunne ikke oppdatere styreverv.' }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger/styre`)
    revalidatePath(`/org/${orgSlug}/styre`)
    return { success: true }
}

export async function removeBoardPosition(orgSlug: string, positionId: string) {
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Soft delete by setting is_active = false
    const { error } = await supabase.from('board_positions')
        .update({ is_active: false })
        .eq('id', positionId)
        .eq('organization_id', orgId)

    if (error) return { error: error.message }

    revalidatePath(`/org/${orgSlug}/innstillinger/styre`)
    revalidatePath(`/org/${orgSlug}/styre`)
    return { success: true }
}
