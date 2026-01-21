'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { revalidatePath } from 'next/cache'

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
}

export type CampaignFilters = {
    status?: string[]
    category?: string[]
}

export async function getCampaigns(org_id: string): Promise<Campaign[]> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('organization_id', org_id)
        .order('created_at', { ascending: false })

    return (data || []) as Campaign[]
}

export async function createCampaign(org_id: string, subject: string, content: string, filters?: CampaignFilters) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('email_campaigns').insert({
        organization_id: org_id,
        subject,
        content,
        status: 'draft',
        created_by: user.id,
        filters: filters || null
    })

    if (error) return { error: error.message }

    revalidatePath(`/org/${org_id}/kommunikasjon`)
    return { success: true }
}

export async function sendCampaign(org_id: string, campaignId: string) {
    const supabase = await createClient()

    // 1. Fetch Campaign & Org Details (contact_email, name)
    const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('organization_id', org_id)
        .single()

    const { data: org } = await supabase
        .from('organizations')
        .select('name, contact_email')
        .eq('id', org_id)
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
        .eq('organization_id', org_id)
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

    // 4. Send Emails
    let successCount = 0
    const { injectTracking } = await import('@/lib/email/tracking-helpers')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    for (const member of members) {
        if (!member.email) continue

        // A. Insert Recipient to get Tracking ID
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
            console.error('Failed to create recipient record:', recipientError)
            continue
        }

        // B. Personalize & Inject Tracking
        let personalizedContent = campaign.content.replace('{{navn}}', member.first_name)
        let htmlContent = `<div style="font-family: sans-serif;">${personalizedContent}</div>`

        // Inject Tracking
        htmlContent = injectTracking(htmlContent, recipient.unique_tracking_id, baseUrl)

        console.log('[DEBUG Tracking] Tracking ID:', recipient.unique_tracking_id)
        console.log('[DEBUG Tracking] Original Content Length:', campaign.content.length)
        console.log('[DEBUG Tracking] Tracked Content Length:', htmlContent.length)
        console.log('[DEBUG Tracking] Has Pixel:', htmlContent.includes('<img src='))
        console.log('[DEBUG Tracking] Wraps Links:', htmlContent.includes('track/click'))

        // C. Send via Resend
        const res = await sendEmail({
            to: member.email,
            subject: campaign.subject,
            html: htmlContent,
            text: personalizedContent,
            organizationId: org_id,
            campaignId: campaign.id,
            memberId: member.id,
            from,
            replyTo
        })

        // D. Update Status
        if (res.success) {
            successCount++
            await supabase.from('campaign_recipients').update({ status: 'sent' }).eq('id', recipient.id)
        } else {
            await supabase.from('campaign_recipients').update({ status: 'failed' }).eq('id', recipient.id)
        }
    }

    // 5. Update Status to Sent
    await supabase.from('email_campaigns').update({
        status: 'sent',
        recipient_count: successCount
    }).eq('id', campaignId)

    revalidatePath(`/org/${org_id}/kommunikasjon`)
    return { success: true, count: successCount }
}
