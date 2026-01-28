import { getCampaigns } from './actions'
import CommunicationPageContent from './CommunicationPageContent'

export default async function CommunicationPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    // getCampaigns uses requireOrgAccess internally for security
    const campaigns = await getCampaigns(slug)

    return <CommunicationPageContent campaigns={campaigns} orgSlug={slug} />
}
