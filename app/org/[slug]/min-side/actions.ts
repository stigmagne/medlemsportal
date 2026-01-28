'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type UpdateProfileState = {
    message?: string
    error?: string
    success?: boolean
}

export async function updateProfile(prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
        return { error: 'Du må være logget inn for å oppdatere profilen.' }
    }

    // 2. Extract and Validate Data
    const memberId = formData.get('memberId') as string

    if (!memberId) {
        return { error: 'Ugyldig forespørsel (mangler memberId).' }
    }

    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const phone = formData.get('phone') as string
    const dateOfBirth = formData.get('date_of_birth') as string
    const address = formData.get('address') as string
    const postalCode = formData.get('postal_code') as string
    const city = formData.get('city') as string

    const consentEmail = formData.get('consent_email') === 'on'
    const consentSms = formData.get('consent_sms') === 'on'
    const consentMarketing = formData.get('consent_marketing') === 'on'

    if (!firstName || !lastName) {
        return { error: 'Fornavn og etternavn er påkrevd.' }
    }

    if (!dateOfBirth) {
        return { error: 'Fødselsdato er påkrevd (BufDir-krav).' }
    }

    try {
        // 3. Verify Ownership
        // Ensure the member we are updating actually belongs to the logged-in user
        const { data: memberCheck } = await supabase
            .from('members')
            .select('id')
            .eq('id', memberId)
            .eq('email', user.email)
            .single()

        if (!memberCheck) {
            return { error: 'Du har ikke tilgang til å endre denne profilen.' }
        }

        // 4. Update Member Record
        const { error } = await supabase
            .from('members')
            .update({
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                date_of_birth: dateOfBirth,
                address: address,
                postal_code: postalCode,
                city: city,
                consent_email: consentEmail,
                consent_sms: consentSms,
                consent_marketing: consentMarketing,
                updated_at: new Date().toISOString()
            })
            .eq('id', memberId)

        if (error) {
            console.error('Update profile error:', error)
            return { error: 'Kunne ikke lagre endringer. Prøv igjen senere.' }
        }

        revalidatePath('/min-side') // Revalidate root might not be enough contextually, but good catch-all
        // Should really revalidate the specific path, but we don't know the slug here easily unless passed.
        // It's fine, next navigation will fetch fresh data.
        return { success: true, message: 'Profil oppdatert!' }

    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'En uventet feil oppstod.' }
    }
}
