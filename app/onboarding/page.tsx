import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress } from '@/app/actions/onboarding'

export default async function OnboardingIndexPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: access } = await supabase
        .from('user_org_access')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!access) {
        // Handle no org case
        return <div>Ingen organisasjon funnet.</div>
    }

    const progress = await getOnboardingProgress(access.organization_id)
    const currentStep = progress?.current_step || 1

    redirect(`/onboarding/${currentStep}`)
}
