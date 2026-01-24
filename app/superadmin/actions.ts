'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function resolveError(errorId: string) {
    const supabase = await createClient()

    // Auth check should be here or rely on RLS (but RLS enforces superadmin check for UPDATE/DELETE)
    // We'll trust RLS + layout check for now, but explicit check is better.
    // ...

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
    const supabase = await createClient()

    // Auth check implies usage within superadmin context where RLS allows management
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
