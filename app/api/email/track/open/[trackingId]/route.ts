import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientInfo } from '@/lib/email/tracking-helpers'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trackingId: string }> }
) {
    const { trackingId } = await params
    const { userAgent, ipAddress } = await getClientInfo()

    // Create transparent GIF 1x1
    const transparentGif = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
        0x01, 0x00, 0x3B
    ])

    const responseHeaders = {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }

    try {
        if (!trackingId) {
            return new Response(transparentGif, { headers: responseHeaders })
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
            .select('id, opened_at, status')
            .eq('unique_tracking_id', trackingId)
            .single()

        if (error || !recipient) {
            // Silently fail for the user, but log it
            console.error('Tracking Error: Recipient not found for ID', trackingId)
            return new Response(transparentGif, { headers: responseHeaders })
        }

        // 2. Update if first open
        if (!recipient.opened_at) {
            const updates: any = {
                opened_at: new Date().toISOString()
            }
            // Only update status if it's currently just sent/delivered
            if (recipient.status === 'sent' || recipient.status === 'delivered') {
                updates.status = 'opened'
            }

            await supabase
                .from('campaign_recipients')
                .update(updates)
                .eq('id', recipient.id)
        }

        // 3. Log Event
        await supabase
            .from('email_tracking_events')
            .insert({
                campaign_recipient_id: recipient.id,
                event_type: 'open',
                user_agent: userAgent,
                ip_address: ipAddress
            })

    } catch (e) {
        console.error('Tracking Pixel Error:', e)
    }

    return new Response(transparentGif, { headers: responseHeaders })
}
