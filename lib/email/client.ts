import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

// Initialize Resend with API key or a placeholder to prevent build errors
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key')

type SendEmailParams = {
    to: string
    subject: string
    html: string
    text?: string
    from?: string // Default to a configured sender
    organizationId: string
    campaignId?: string
    memberId?: string
    replyTo?: string | string[]
}

export async function sendEmail({
    to,
    subject,
    html,
    text,
    from = process.env.RESEND_FROM_EMAIL || 'Din Forening <onboarding@resend.dev>', // Update this with verified domain later
    organizationId,
    campaignId,
    memberId,
    replyTo
}: SendEmailParams) {
    try {
        const data = await resend.emails.send({
            from,
            to,
            subject,
            html,
            text,
            replyTo: replyTo as string | string[] | undefined
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
            status: 'sent', // Resend queues it, but for our log 'sent' or 'queued' is fine.
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
        const batchPayload = emails.map(e => ({
            from: e.from || process.env.RESEND_FROM_EMAIL || 'Din Forening <onboarding@resend.dev>',
            to: e.to,
            subject: e.subject,
            html: e.html,
            text: e.text,
            reply_to: e.replyTo as string | string[] | undefined
        }))

        // Chunking for Resend Batch Limit (Max 100)
        // We handle chunking here to be safe, even if caller chunks too.
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
                // We should probably log failed emails here, but we lack the context of which ones failed if the whole batch fails.
                // If the batch fails, assume all in chunk failed.
                continue
            }

            if (data && data.data) {
                successCount += data.data.length
                // Log success for these IDs? 
                // Currently logging happens in the caller in the loop. 
                // Since this is batch, we need to return the IDs so caller can update status.
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
