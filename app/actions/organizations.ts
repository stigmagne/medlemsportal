'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'o')
        .replace(/å/g, 'a')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)
}

export interface CreateOrganizationInput {
    name: string
    orgNumber?: string
    contactEmail?: string
}

export async function createOrganization(input: CreateOrganizationInput) {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Du må være logget inn for å opprette en organisasjon' }
    }

    // Validate input
    if (!input.name || input.name.trim().length < 2) {
        return { error: 'Organisasjonsnavn må være minst 2 tegn' }
    }

    // Generate unique slug
    let baseSlug = generateSlug(input.name)
    let slug = baseSlug
    let attempts = 0

    while (attempts < 10) {
        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .maybeSingle()

        if (!existing) break

        attempts++
        slug = `${baseSlug}-${attempts}`
    }

    if (attempts >= 10) {
        return { error: 'Kunne ikke generere unik URL for organisasjonen. Prøv et annet navn.' }
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name: input.name.trim(),
            slug,
            org_number: input.orgNumber?.trim() || null,
            contact_email: input.contactEmail?.trim() || user.email,
        })
        .select('id, slug')
        .single()

    if (orgError) {
        console.error('Error creating organization:', orgError)
        return { error: 'Kunne ikke opprette organisasjon. Prøv igjen.' }
    }

    // Add user as org_owner
    const { error: accessError } = await supabase
        .from('user_org_access')
        .insert({
            user_id: user.id,
            organization_id: org.id,
            role: 'org_owner',
        })

    if (accessError) {
        console.error('Error adding user access:', accessError)
        // Try to clean up the org
        await supabase.from('organizations').delete().eq('id', org.id)
        return { error: 'Kunne ikke gi deg tilgang til organisasjonen. Prøv igjen.' }
    }

    // Initialize onboarding progress
    const { error: onboardingError } = await supabase
        .from('onboarding_progress')
        .insert({
            org_id: org.id,
            current_step: 1,
            completed_steps: [],
            skipped_steps: [],
            onboarding_data: {},
        })

    if (onboardingError) {
        console.error('Error initializing onboarding:', onboardingError)
        // Non-critical, continue
    }

    revalidatePath('/min-side')

    return {
        success: true,
        orgSlug: org.slug,
        redirectTo: `/onboarding`
    }
}
