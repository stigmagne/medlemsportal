'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth/helpers"

export async function resolveError(errorId: string) {
    // SECURITY: Require superadmin role
    await requireRole('superadmin')

    const supabase = await createClient()

    const { error } = await supabase
        .from('error_reports')
        .update({ status: 'resolved' })
        .eq('id', errorId)

    if (error) {
        console.error("Failed to resolve error:", error)
        return { success: false, message: error.message }
    }

    revalidatePath('/superadmin/errors')
    return { success: true }
}

export async function deleteError(errorId: string) {
    // SECURITY: Require superadmin role
    await requireRole('superadmin')

    const supabase = await createClient()
    const { error } = await supabase
        .from('error_reports')
        .delete()
        .eq('id', errorId)

    if (error) {
        return { success: false, message: error.message }
    }

    revalidatePath('/superadmin/errors')
    return { success: true }
}
