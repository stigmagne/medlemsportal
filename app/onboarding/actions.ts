'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getOrganizationRoles, findKeyRoles, getOrganizationDetails } from '@/lib/brreg'

export type OnboardingData = {
    // Step 1: Org Info
    orgName?: string
    orgNr?: string
    orgType?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string

    // Step 2: Branding
    logoUrl?: string
    themeColor?: string

    // Step 3: Categories
    categories?: any[]

    // Step 4: Import
    importedCount?: number
}

export type OnboardingState = {
    currentStep: number
    completedSteps: number[]
    data: OnboardingData
}

export async function getOnboardingProgress(orgId: string): Promise<OnboardingState | null> {
    const supabase = await createClient()

    // Since FKs are broken in DB, we verify access via membership manually if needed, 
    // but for now relying on user having access to the org context (e.g. via params or session)
    // Here we strictly query by org_id. Ideally we strictly check permissions.

    const { data } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('org_id', orgId)
        .single()

    if (!data) return null

    return {
        currentStep: data.current_step,
        completedSteps: data.completed_steps || [],
        data: data.onboarding_data || {}
    }
}

export async function updateOnboardingStep(
    orgId: string,
    stepNumber: number,
    stepData: Partial<OnboardingData>
) {
    const supabase = await createClient()

    // Fetch current data to merge
    const current = await getOnboardingProgress(orgId)
    const newData = { ...(current?.data || {}), ...stepData }
    const completedSteps = current ? [...new Set([...current.completedSteps, stepNumber])] : [stepNumber]

    // Determine next step (simple increment)
    // Logic can be more complex if needed (skipping steps)
    const nextStep = stepNumber + 1

    const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
            org_id: orgId,
            current_step: nextStep,
            completed_steps: completedSteps,
            onboarding_data: newData,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error updating onboarding:', error)
        throw new Error('Kunne ikke lagre fremgang')
    }

    revalidatePath(`/onboarding`)
    return { success: true, nextStep }
}

export async function completeOnboarding(orgId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('onboarding_progress')
        .update({
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId)

    if (error) throw error

    // Here we would strictly redirect to dashboard
    return { success: true }
}

export async function fetchOrganizationRoles(orgNr: string) {
    // Validate orgNr format simple check
    if (!/^\d{9}$/.test(orgNr)) {
        return { error: 'Ugyldig organisasjonsnummer. Det må bestå av 9 siffer.' }
    }

    try {
        const details = await getOrganizationDetails(orgNr)
        const roles = await getOrganizationRoles(orgNr)

        if (!details) {
            return { error: 'Fant ikke organisasjonen i Brønnøysundregistrene.' }
        }

        const keyRoles = roles ? findKeyRoles(roles) : null

        return {
            success: true,
            details,
            keyRoles
        }
    } catch (e) {
        console.error('Error fetching brreg data:', e)
        return { error: 'Klarte ikke hente data fra Brønnøysundregistrene.' }
    }
}
