'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'

export async function getCaseSettings(slug: string) {
    // SECURITY: Require at least admin access to view case settings
    const { orgId } = await requireOrgAccess(slug, 'org_admin')
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('organizations')
        .select('case_number_format, last_case_year, last_case_number')
        .eq('slug', slug)
        .single()

    if (error) throw error
    return data
}

export async function updateCaseSettings(slug: string, formData: FormData) {
    // SECURITY: Require admin access to update case settings
    const { orgId } = await requireOrgAccess(slug, 'org_admin')
    const supabase = await createClient()

    // Auth check implies org access via RLS or middleware usually, 
    // but explicit check is good.

    const format = formData.get('format') as string
    const lastNumber = parseInt(formData.get('lastNumber') as string) || 0
    const lastYear = parseInt(formData.get('lastYear') as string) || new Date().getFullYear()

    const { error } = await supabase
        .from('organizations')
        .update({
            case_number_format: format,
            last_case_number: lastNumber,
            last_case_year: lastYear,
            updated_at: new Date().toISOString()
        })
        .eq('slug', slug)

    if (error) {
        console.error('Update settings error:', error)
        return { error: 'Kunne ikke lagre innstillinger' }
    }

    revalidatePath(`/org/${slug}/innstillinger/saker`)
    return { success: true }
}
