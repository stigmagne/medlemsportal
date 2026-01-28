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

    // Get org access with organization info (needed for server actions and Step 6)
    const { data: access } = await supabase
        .from('user_org_access')
        .select('organization_id, organizations(id, slug, name, stripe_account_id, stripe_charges_enabled)')
        .eq('user_id', user.id)
        .single()

    if (!access || !access.organizations) {
        return <div>Ingen organisasjon funnet for denne brukeren.</div>
    }

    // Extract org data from the organizations relation
    const org = access.organizations as unknown as {
        id: string
        slug: string
        name: string
        stripe_account_id: string | null
        stripe_charges_enabled: boolean
    }
    const orgSlug = org.slug
    const progress = await getOnboardingProgress(orgSlug)

    const renderStep = () => {
        switch (stepNumber) {
            case 1: return <Step1OrgInfo orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 2: return <Step2Styling orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 3: return <Step3Categories orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 4: return <Step4Import orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 5: return <Step5Email orgSlug={orgSlug} data={progress?.onboarding_data} />
            case 6: return (
                <Step6Completion
                    orgSlug={orgSlug}
                    orgId={org.id}
                    orgName={org.name}
                    data={progress?.onboarding_data}
                    hasStripeAccount={!!org.stripe_account_id}
                    stripeChargesEnabled={org.stripe_charges_enabled || false}
                />
            )
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
