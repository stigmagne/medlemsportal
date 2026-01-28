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

// Create membership categories in the database
export async function saveMembershipCategories(
    orgSlug: string,
    categories: { name: string; fee: number }[]
) {
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // First, check for existing categories to avoid duplicates
    const { data: existingTypes } = await supabase
        .from('member_types')
        .select('name')
        .eq('org_id', orgId)

    const existingNames = new Set(existingTypes?.map(t => t.name.toLowerCase()) || [])

    // Filter out categories that already exist
    const newCategories = categories.filter(
        cat => cat.name && !existingNames.has(cat.name.toLowerCase())
    )

    if (newCategories.length === 0) {
        return { success: true, created: 0 }
    }

    // Insert new categories
    const { error } = await supabase
        .from('member_types')
        .insert(
            newCategories.map(cat => ({
                org_id: orgId,
                name: cat.name,
                fee: cat.fee || 0,
                description: `${cat.name} medlemskap`
            }))
        )

    if (error) {
        console.error('Error creating membership categories:', error)
        return { error: error.message }
    }

    revalidatePath(`/org/${orgSlug}/innstillinger`)
    return { success: true, created: newCategories.length }
}

// Create board members during onboarding
export async function createBoardMembers(
    orgSlug: string,
    members: { firstName: string; lastName: string; email: string; role: string }[]
) {
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    // Check for existing members with same email
    const { data: existingMembers } = await supabase
        .from('members')
        .select('email')
        .eq('organization_id', orgId)

    const existingEmails = new Set(
        existingMembers?.map(m => m.email?.toLowerCase()).filter(Boolean) || []
    )

    // Filter out members that already exist
    const newMembers = members.filter(
        m => m.email && !existingEmails.has(m.email.toLowerCase())
    )

    if (newMembers.length === 0) {
        return { success: true, created: 0 }
    }

    // Insert new members
    const { error } = await supabase
        .from('members')
        .insert(
            newMembers.map(m => ({
                organization_id: orgId,
                first_name: m.firstName,
                last_name: m.lastName,
                email: m.email,
                membership_status: 'active',
                membership_category: 'styremedlem',
                joined_date: new Date().toISOString().split('T')[0],
                notes: `Styremedlem (${m.role}) - Lagt til under onboarding`
            }))
        )

    if (error) {
        console.error('Error creating board members:', error)
        return { error: error.message }
    }

    revalidatePath(`/org/${orgSlug}/medlemmer`)
    return { success: true, created: newMembers.length }
}
