import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCampaigns } from './actions'
import CommunicationPageContent from './CommunicationPageContent'

export default async function CommunicationPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: organization } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!organization) redirect('/')

    const campaigns = await getCampaigns(organization.id)

    return <CommunicationPageContent campaigns={campaigns} org_id={organization.id} />
}
