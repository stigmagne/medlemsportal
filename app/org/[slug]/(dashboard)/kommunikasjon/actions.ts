'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/helpers'
import { sendEmail } from '@/lib/email/client'
import { revalidatePath } from 'next/cache'
import { enforceRateLimit, RateLimitStrategy } from '@/lib/rate-limit'

export type Campaign = {
    id: string
    subject: string
    content: string
    status: string
    sent_at: string
    recipient_count: number
    created_at: string
    filters: {
        status?: string[]
        category?: string[]
    } | null
    reply_to?: string
}

export type CampaignFilters = {
    status?: string[]
    category?: string[]
}

export async function getCampaigns(orgSlug: string): Promise<Campaign[]> {
    // SECURITY: Require at least member access to view campaigns
    const { orgId } = await requireOrgAccess(orgSlug, 'org_member')
    const supabase = await createClient()

    const { data } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('organization_id', orgId)  // Server-verified orgId (IDOR FIX)
        .order('created_at', { ascending: false })

    return (data || []) as Campaign[]
}

export async function createCampaign(orgSlug: string, subject: string, content: string, filters?: CampaignFilters, replyTo?: string) {
    // SECURITY: Require admin access to create campaigns
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('email_campaigns').insert({
        organization_id: orgId,  // Server-verified orgId (IDOR FIX)
        subject,
        content,
        status: 'draft',
        created_by: user.id,
        filters: filters || null,
        reply_to: replyTo || null
    })

    if (error) return { error: error.message }

    revalidatePath(`/org/${orgSlug}/kommunikasjon`)
    return { success: true }
}

export async function sendCampaign(orgSlug: string, campaignId: string) {
    // SECURITY: Require admin access to send campaigns
    const { orgId } = await requireOrgAccess(orgSlug, 'org_admin')

    // RATE LIMIT: Prevent email spam - 5 campaigns per hour per organization (H5)
    try {
        await enforceRateLimit(RateLimitStrategy.EMAIL_CAMPAIGN, orgId)
    } catch (error: any) {
        return {
            error: `Rate limit overskredet. Maksimalt 5 kampanjer per time. Vennligst vent ${Math.ceil((error.retryAfter || 60) / 60)} minutter.`
        }
    }

    const supabase = await createClient()

    // 1. Fetch Campaign & Org Details (contact_email, name)
    const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('organization_id', orgId)  // Server-verified orgId (IDOR FIX)
        .single()

    const { data: org } = await supabase
        .from('organizations')
        .select('name, contact_email')
        .eq('id', orgId)  // Server-verified orgId (IDOR FIX)
        .single()

    if (!campaign) return { error: 'Campaign not found' }
    if (!org) return { error: 'Organization not found' }

    if (campaign.status !== 'draft' && campaign.status !== 'failed') return { error: 'Campaign already sent or processing' }

    // Prepare Sender Details
    // From: "Forening Navn <onboarding@resend.dev>" (or custom domain if verified)
    const fromName = org.name.replace(/[<>]/g, '') // Sanitize name
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const from = `"${fromName}" <${fromAddress}>`

    const replyTo = org.contact_email ? org.contact_email : undefined

    // 2. Fetch Recipients based on filters
    let query = supabase
        .from('members')
        .select('id, email, first_name')
        .eq('organization_id', orgId)  // Server-verified orgId (IDOR FIX)
        .not('email', 'is', null)

    // Apply filters if they exist
    const filters = campaign.filters as CampaignFilters | null
    if (filters) {
        if (filters.status && filters.status.length > 0) {
            query = query.in('membership_status', filters.status)
        }
        if (filters.category && filters.category.length > 0) {
            query = query.in('membership_category', filters.category)
        }
    } else {
        // Default to active members if no filters specified (legacy behavior compat)
        query = query.eq('membership_status', 'active')
    }

    const { data: members } = await query

    if (!members || members.length === 0) return { error: 'No active members with email found' }

    // 3. Update Status to Sending
    await supabase.from('email_campaigns').update({ status: 'sending', sent_at: new Date().toISOString() }).eq('id', campaignId)

    // 4. Send Emails in Batches
    let successCount = 0
    const { injectTracking } = await import('@/lib/email/tracking-helpers')
    const { sendEmailsBatch } = await import('@/lib/email/client')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Use custom Reply-To from campaign if set, otherwise fallback to provided replyTo arg or org contact
    // Note: createCampaign saves it to DB, so we should trust campaign.reply_to first.
    // Cast campaign to any if types mismatch, but we updated Campaign type above.
    const finalReplyTo = (campaign as Campaign).reply_to || replyTo

    // Chunk size 50 (Safe max for Vercel timeout/Resend limit)
    const chunkSize = 50
    for (let i = 0; i < members.length; i += chunkSize) {
        const chunk = members.slice(i, i + chunkSize)
        const emailBatch: any[] = []
        const recipientMap: Record<string, { recipientId: string, memberId: string }> = {}

        for (const member of chunk) {
            if (!member.email) continue

            // A. Create Recipient Record
            const { data: recipient, error: recipientError } = await supabase
                .from('campaign_recipients')
                .insert({
                    campaign_id: campaignId,
                    member_id: member.id,
                    email: member.email,
                    status: 'queued'
                })
                .select('id, unique_tracking_id')
                .single()

            if (recipientError || !recipient) {
                console.error(`Failed to init recipient for ${member.email}`)
                continue
            }

            // B. Personalize Content
            let cleanContent = campaign.content.replace(/<img[^>]+src="([^">]+)"[^>]*>/g, (match: string, src: string) => {
                const widthMatch = match.match(/width="?(\d+)"?/);
                const width = widthMatch ? `width="${widthMatch[1]}"` : 'width="100%"';
                const style = widthMatch ? `max-width: 100%; width: ${widthMatch[1]}px;` : 'max-width: 100%;';
                return `<img src="${src}" ${width} style="${style} height: auto; border-radius: 4px; display: block; margin: 20px 0;" border="0" />`
            });

            let personalizedContent = cleanContent.replace(/{{navn}}/g, member.first_name || 'Medlem')
            let htmlContent = `<div style="font-family: sans-serif; font-size: 16px; line-height: 1.6; color: #333;">${personalizedContent}</div>`
            htmlContent = injectTracking(htmlContent, recipient.unique_tracking_id, baseUrl)

            // Add to Batch
            emailBatch.push({
                to: member.email,
                subject: campaign.subject,
                html: htmlContent,
                text: personalizedContent,
                organizationId: orgId,  // Server-verified orgId (IDOR FIX)
                campaignId: campaign.id,
                memberId: member.id,
                from,
                replyTo: finalReplyTo
            })

            recipientMap[member.email] = { recipientId: recipient.id, memberId: member.id }
        }

        // Send Batch
        if (emailBatch.length > 0) {
            const res = await sendEmailsBatch(emailBatch)

            if (res.success) {
                successCount += (res.count || 0)
                // Mark as sent
                const recipientIds = Object.values(recipientMap).map(r => r.recipientId)
                if (recipientIds.length > 0) {
                    await supabase.from('campaign_recipients').update({ status: 'sent' }).in('id', recipientIds)
                }
            } else {
                console.error('Batch failed', res.error)
                // Mark as failed
                const recipientIds = Object.values(recipientMap).map(r => r.recipientId)
                if (recipientIds.length > 0) {
                    await supabase.from('campaign_recipients').update({ status: 'failed' }).in('id', recipientIds)
                }
            }
        }
    }

    // 5. Update Status to Sent
    await supabase.from('email_campaigns').update({
        status: 'sent',
        recipient_count: successCount
    }).eq('id', campaignId)

    revalidatePath(`/org/${orgSlug}/kommunikasjon`)
    return { success: true, count: successCount }
}
