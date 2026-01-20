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

    // Find user's organization (assuming 1 org for now for onboarding context)
    // In a real app, user might have multiple or be creating one.
    // Assuming they are logged in and have an org context or just created one.
    // Let's grab the org they are admin of.

    const { data: access } = await supabase
        .from('user_org_access')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!access) {
        // If no org, create one? Or redirect to create org page?
        // For this scope, assume org exists.
        return <div>Ingen organisasjon funnet for denne brukeren.</div>
    }

    const orgId = access.organization_id
    const progress = await getOnboardingProgress(orgId)

    // Logic to prevent skipping steps
    // If no progress record, they are at step 1.
    // If trying to access step 4 but step 3 marked as not complete...
    // For simplicity, we allow navigation if 'current_step' >= requested step?
    // Or simply rely on the progress returned.

    // Implementation note: We will render the component for the requested step.

    const renderStep = () => {
        switch (stepNumber) {
            case 1: return <Step1OrgInfo orgId={orgId} data={progress?.onboarding_data} />
            case 2: return <Step2Styling orgId={orgId} data={progress?.onboarding_data} />
            case 3: return <Step3Categories orgId={orgId} data={progress?.onboarding_data} />
            case 4: return <Step4Import orgId={orgId} data={progress?.onboarding_data} />
            case 5: return <Step5Email orgId={orgId} data={progress?.onboarding_data} />
            case 6: return <Step6Completion orgId={orgId} />
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
