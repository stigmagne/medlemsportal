'use server'

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export type ReportErrorInput = {
    path: string
    errorMessage: string
    errorDigest?: string
    userComment?: string
    orgId?: string
}

export async function reportSystemError(data: ReportErrorInput) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get user agent
    const userAgent = (await headers()).get('user-agent')

    try {
        const { error } = await supabase
            .from('error_reports')
            .insert({
                user_id: user?.id,
                user_email: user?.email,
                org_id: data.orgId,
                path: data.path,
                error_message: data.errorMessage,
                error_digest: data.errorDigest,
                user_comment: data.userComment,
                user_agent: userAgent,
                status: 'open'
            })

        if (error) {
            console.error("Failed to log error to DB:", error)
            return { success: false, message: "Kunne ikke lagre feilmeldingen. Ironisk nok." }
        }

        return { success: true, message: "Takk! Superheltene er varslet. 🦸‍♂️" }

    } catch (e) {
        console.error("Unexpected error in reportSystemError:", e)
        return { success: false, message: "Noe gikk galt under innsending." }
    }
}
