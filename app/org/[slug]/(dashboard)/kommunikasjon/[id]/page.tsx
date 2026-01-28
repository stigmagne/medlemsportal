import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'

export default async function CampaignDetailsPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', id)
        .single()

    if (!campaign) return <div>Kampanje ikke funnet</div>

    // Get recipients stats
    const { count: sentCount } = await supabase
        .from('campaign_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)
        .eq('status', 'sent')

    const { count: openCount } = await supabase
        .from('campaign_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)
        .eq('opened', true)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-5">
                <Link
                    href={`/org/${slug}/kommunikasjon`}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {campaign.subject}
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {campaign.status}
                        </span>
                        <span>
                            {campaign.sent_at ? `Sendt: ${new Date(campaign.sent_at).toLocaleString()}` : `Opprettet: ${new Date(campaign.created_at).toLocaleDateString()}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Statistikk</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{campaign.recipient_count || sentCount || 0}</div>
                                <div className="text-sm text-gray-500">Mottakere</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{openCount || 0}</div>
                                <div className="text-sm text-gray-500">Åpnet</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Preview */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">Innhold</h3>
                        </div>
                        <div className="p-8 prose prose-sm max-w-none">
                            {/* SECURITY (H2): Use DOMPurify to prevent stored XSS */}
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaign.content) }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
