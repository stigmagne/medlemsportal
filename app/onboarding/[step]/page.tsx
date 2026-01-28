import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress } from '@/app/actions/onboarding'
import ProgressBar from '@/components/onboarding/ProgressBar'
import Step1OrgInfo from '../../../components/onboarding/steps/Step1OrgInfo'
import Step2Styling from '../../../components/onboarding/steps/Step2Styling'
import Step3Categories from '../../../components/onboarding/steps/Step3Categories'
import Step4Import from '../../../components/onboarding/steps/Step4Import'
import Step5Email from '../../../components/onboarding/steps/Step5Email'
import Step6Completion from '../../../components/onboarding/steps/Step6Completion'

export default async function OnboardingWizardPage({
    params
}: {
    params: Promise<{ step: string }>
}) {
    const { step } = await params
    const stepNumber = parseInt(step)
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
        return <div>Ingen organisasjon funnet for denne brukeren.</div>
    }

    // Extract slug from the organizations relation (single object from foreign key)
    const org = access.organizations as unknown as { slug: string }
    const orgSlug = org.slug
    const progress = await getOnboardingProgress(orgSlug)

    // Logic to prevent skipping steps
    // If no progress record, they are at step 1.
    // If trying to access step 4 but step 3 marked as not complete...
    // For simplicity, we allow navigation if 'current_step' >= requested step?
    // Or simply rely on the progress returned.

    // Implementation note: We will render the component for the requested step.

    const renderStep = () => {
        switch (stepNumber) {
            case 1: return <Step1OrgInfo orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 2: return <Step2Styling orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 3: return <Step3Categories orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 4: return <Step4Import orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 5: return <Step5Email orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 6: return <Step6Completion orgSlug={orgSlug} />
            default: return <div>Ugyldig steg</div>
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {stepNumber < 6 && <ProgressBar currentStep={stepNumber} totalSteps={6} />}
            {renderStep()}
        </div>
    )
}
