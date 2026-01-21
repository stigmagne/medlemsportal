'use server'

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function sendSms(orgId: string, message: string, groupId: string) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Fetch Potential Recipients
        // Start building query
        let query = supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .is('deleted_at', null)

        // Simple mock filtering
        if (groupId === 'adults') {
            // Mock: filtered by age (requires fetching birth_date, but for count we just use total for now in this mock step if complex)
            // Or better: Let's actually try to use the view_member_stats_by_age if we wanted real stats.
            // For now, let's keep it simple: 'adults' = all active members (Mock)
        }

        const { count: recipientCount, error: fetchError } = await query

        if (fetchError) throw new Error("Kunne ikke hente mottakere: " + fetchError.message)

        const count = recipientCount || 0
        if (count === 0) {
            return { success: false, error: "Ingen mottakere funnet i denne gruppen." }
        }

        // 2. Calculate Cost
        const segmentCount = Math.ceil(Math.max(message.length, 1) / 160)
        const pricePerSegment = 0.59
        const totalCost = count * segmentCount * pricePerSegment

        console.log(`[Mock SMS] Sending to ${count} recipients. Cost: ${totalCost.toFixed(2)} NOK`)

        // 3. Log to Database
        const { error: logError } = await supabase
            .from('sms_logs')
            .insert({
                organization_id: orgId,
                recipient_count: count,
                message_content: message,
                status: 'sent',
                total_cost: totalCost,
                provider: 'mock',
                created_by: (await cookies()).get('sb-user-id')?.value
            })

        if (logError) {
            console.error("Failed to log SMS:", logError)
            throw new Error("Feil ved logging av SMS: " + logError.message)
        }

        return { success: true, count }

    } catch (error: any) {
        console.error("SMS Send Error:", error)
        return { success: false, error: error.message || "En ukjent feil oppstod." }
    }
}
