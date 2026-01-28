import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress } from '@/app/actions/onboarding'

export default async function OnboardingIndexPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Get org access with organization slug (needed for server actions)
    const { data: access } = await supabase
        .from('user_org_access')
        .select('organization_id, organizations(slug)')
        .eq('user_id', user.id)
        .single()

    if (!access || !access.organizations) {
        // Handle no org case
        return <div>Ingen organisasjon funnet.</div>
    }

    // Extract slug from the organizations relation (single object from foreign key)
    const org = access.organizations as unknown as { slug: string }
    const orgSlug = org.slug
    const progress = await getOnboardingProgress(orgSlug)
    const currentStep = progress?.current_step || 1

    redirect(`/onboarding/${currentStep}`)
}
