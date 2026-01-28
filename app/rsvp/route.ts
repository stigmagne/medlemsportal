
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyRsvpToken } from '@/lib/rsvp/tokens'

export async function POST(request: NextRequest) {
    try {
        const { token, status } = await request.json()

        if (!token || !status) {
            return NextResponse.json({ error: 'Missing token or status' }, { status: 400 })
        }

        // 1. Verify token
        const verification = verifyRsvpToken(token)
        if (!verification.valid || !verification.data) {
            return NextResponse.json({ error: verification.error || 'Invalid token' }, { status: 401 })
        }

        const { meetingId, memberId } = verification.data

        // 2. Validate status
        if (!['yes', 'no', 'maybe'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // 3. Use admin client (no user session needed, token proves auth)
        const supabase = await createAdminClient()

        // 4. Verify invite exists
        const { data: invite } = await supabase
            .from('meeting_attendees')
            .select('id')
            .eq('meeting_id', meetingId)
            .eq('member_id', memberId)
            .single()

        if (!invite) {
            return NextResponse.json({ error: 'Not invited' }, { status: 403 })
        }

        // 5. Update RSVP
        const { error } = await supabase
            .from('meeting_attendees')
            .update({
                rsvp_status: status,
                rsvp_date: new Date().toISOString()
            })
            .eq('meeting_id', meetingId)
            .eq('member_id', memberId)

        if (error) {
            console.error('RSVP Update Error:', error)
            return NextResponse.json({ error: 'Update failed' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('RSVP Handler Error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
