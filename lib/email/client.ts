import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

// Initialize Resend with API key or a placeholder to prevent build errors
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key')

// Default from address - uses environment variable or falls back to Resend default
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Din Forening <noreply@medlemsportalen.no>'

type SendEmailParams = {
    to: string
    subject: string
    html: string
    text?: string
    from?: string // Will use DEFAULT_FROM if not specified
    organizationId: string
    campaignId?: string
    memberId?: string
    replyTo?: string | string[]
}

/**
 * Get organization's email settings for sending
 */
async function getOrgEmailSettings(organizationId: string): Promise<{ contactEmail?: string; orgName?: string }> {
    try {
        const supabase = await createClient()
        const { data: org } = await supabase
            .from('organizations')
            .select('contact_email, name')
            .eq('id', organizationId)
            .single()

        return {
            contactEmail: org?.contact_email || undefined,
            orgName: org?.name || undefined
        }
    } catch {
        return {}
    }
}

export async function sendEmail({
    to,
    subject,
    html,
    text,
    from,
    organizationId,
    campaignId,
    memberId,
    replyTo
}: SendEmailParams) {
    try {
        // Get organization's email settings if not explicitly provided
        let finalFrom = from || DEFAULT_FROM
        let finalReplyTo = replyTo

        if (organizationId && !replyTo) {
            const orgSettings = await getOrgEmailSettings(organizationId)

            // Use org's contact email as reply-to if available
            if (orgSettings.contactEmail) {
                finalReplyTo = orgSettings.contactEmail
            }

            // Optionally customize from name with org name (email stays the same for deliverability)
            if (orgSettings.orgName && !from) {
                finalFrom = `${orgSettings.orgName} <${DEFAULT_FROM.match(/<(.+)>/)?.[1] || 'noreply@medlemsportalen.no'}>`
            }
        }

        const data = await resend.emails.send({
            from: finalFrom,
            to,
            subject,
            html,
            text,
            replyTo: finalReplyTo as string | string[] | undefined
        })

        if (data.error) {
            console.error('Resend Error:', data.error)
            await logEmail({
                organizationId,
                campaignId,
                memberId,
                status: 'failed',
                error_message: data.error.message
            })
            return { success: false, error: data.error }
        }

        await logEmail({
            organizationId,
            campaignId,
            memberId,
            status: 'sent',
            providerId: data.data?.id
        })

        return { success: true, id: data.data?.id }

    } catch (e: any) {
        console.error('Send Exception:', e)
        await logEmail({
            organizationId,
            campaignId,
            memberId,
            status: 'failed',
            error_message: e.message
        })
        return { success: false, error: e }
    }
}

// Batch Send
export async function sendEmailsBatch(emails: SendEmailParams[]) {
    try {
        // For batch, we need to resolve org settings upfront
        const orgSettingsCache: Record<string, { contactEmail?: string; orgName?: string }> = {}

        const batchPayload = await Promise.all(emails.map(async e => {
            let finalFrom = e.from || DEFAULT_FROM
            let finalReplyTo = e.replyTo

            if (e.organizationId) {
                if (!orgSettingsCache[e.organizationId]) {
                    orgSettingsCache[e.organizationId] = await getOrgEmailSettings(e.organizationId)
                }
                const orgSettings = orgSettingsCache[e.organizationId]

                if (orgSettings.contactEmail && !e.replyTo) {
                    finalReplyTo = orgSettings.contactEmail
                }
                if (orgSettings.orgName && !e.from) {
                    finalFrom = `${orgSettings.orgName} <${DEFAULT_FROM.match(/<(.+)>/)?.[1] || 'noreply@medlemsportalen.no'}>`
                }
            }

            return {
                from: finalFrom,
                to: e.to,
                subject: e.subject,
                html: e.html,
                text: e.text,
                reply_to: finalReplyTo as string | string[] | undefined
            }
        }))

        // Chunking for Resend Batch Limit (Max 100)
        const chunks = []
        for (let i = 0; i < batchPayload.length; i += 100) {
            chunks.push(batchPayload.slice(i, i + 100))
        }

        let successCount = 0
        let errors: any[] = []

        for (const chunk of chunks) {
            const { data, error } = await resend.batch.send(chunk)

            if (error) {
                console.error('Batch Send Error:', error)
                errors.push(error)
                continue
            }

            if (data && data.data) {
                successCount += data.data.length
            }
        }

        return { success: true, count: successCount, errors }

    } catch (e: any) {
        console.error('Batch Exception:', e)
        return { success: false, error: e }
    }
}

// ... existing logEmail ...
async function logEmail(params: {
    organizationId: string
    campaignId?: string
    memberId?: string
    status: string
    providerId?: string
    error_message?: string
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('email_logs').insert({
        organization_id: params.organizationId,
        campaign_id: params.campaignId || null,
        member_id: params.memberId || null,
        status: params.status,
        provider_id: params.providerId || null,
        error_message: params.error_message || null
    })

    if (error) {
        console.error('Failed to log email:', error)
    }
}
