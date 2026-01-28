'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireOrgAccess } from '@/lib/auth/helpers'

export async function getOnboardingProgress(orgSlug: string) {
    // SECURITY: Verify org access and derive orgId server-side
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('org_id', orgId)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching onboarding progress:', error)
    }

    return data
}

export async function updateOnboardingProgress(
    orgSlug: string,
    step: number,
    data?: any
) {
    // SECURITY: Verify org access and derive orgId server-side
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    // First, get current progress to append to completed_steps
    const { data: current } = await supabase
        .from('onboarding_progress')
        .select('completed_steps')
        .eq('org_id', orgId)
        .single()

    let completedSteps = current?.completed_steps || []
    if (!completedSteps.includes(step)) {
        completedSteps.push(step)
    }

    // Merge new data with existing data
    const { data: existingData } = await supabase
        .from('onboarding_progress')
        .select('onboarding_data')
        .eq('org_id', orgId)
        .single()

    const newData = { ...(existingData?.onboarding_data || {}), ...data }

    const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
            org_id: orgId,
            current_step: step + 1, // Advance to next step automatically
            completed_steps: completedSteps, // Marks CURRENT step as complete
            onboarding_data: newData,
            updated_at: new Date().toISOString()
        })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function skipOnboardingStep(
    orgSlug: string,
    step: number
) {
    // SECURITY: Verify org access and derive orgId server-side
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    const { data: current } = await supabase
        .from('onboarding_progress')
        .select('skipped_steps')
        .eq('org_id', orgId)
        .single()

    let skippedSteps = current?.skipped_steps || []
    if (!skippedSteps.includes(step)) {
        skippedSteps.push(step)
    }

    const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
            org_id: orgId,
            current_step: step + 1,
            skipped_steps: skippedSteps,
            updated_at: new Date().toISOString()
        })

    if (error) {
        return { error: error.message }
    }
    return { success: true }
}


export async function completeOnboarding(orgSlug: string) {
    // SECURITY: Verify org access and derive orgId server-side
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    const supabase = await createClient()

    const { error } = await supabase
        .from('onboarding_progress')
        .update({
            completed_at: new Date().toISOString()
        })
        .eq('org_id', orgId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
