import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientInfo } from '@/lib/email/tracking-helpers'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trackingId: string }> }
) {
    const { trackingId } = await params
    const { userAgent, ipAddress } = await getClientInfo()
    const searchParams = request.nextUrl.searchParams
    const targetUrl = searchParams.get('url')

    if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 })
    }

    try {
        if (!trackingId) {
            return NextResponse.redirect(targetUrl)
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    persistSession: false
                }
            }
        )

        // 1. Find Recipient
        const { data: recipient, error } = await supabase
            .from('campaign_recipients')
            .select('id, first_clicked_at, clicked_count, status')
            .eq('unique_tracking_id', trackingId)
            .single()

        if (error || !recipient) {
            console.error('Click Tracking Error: Recipient not found for ID', trackingId)
            return NextResponse.redirect(targetUrl)
        }

        // 2. Update Recipient Stats
        const updates: any = {
            clicked_count: (recipient.clicked_count || 0) + 1
        }

        // If first click
        if (!recipient.first_clicked_at) {
            updates.first_clicked_at = new Date().toISOString()
            // Mark as clicked (which implies opened)
            if (recipient.status !== 'clicked') {
                updates.status = 'clicked'
            }
        }

        await supabase
            .from('campaign_recipients')
            .update(updates)
            .eq('id', recipient.id)

        // 3. Log Event
        await supabase
            .from('email_tracking_events')
            .insert({
                campaign_recipient_id: recipient.id,
                event_type: 'click',
                clicked_url: targetUrl,
                user_agent: userAgent,
                ip_address: ipAddress
            })

    } catch (e) {
        console.error('Click Tracking Error:', e)
    }

    return NextResponse.redirect(targetUrl)
}
