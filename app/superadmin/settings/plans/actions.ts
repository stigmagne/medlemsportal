'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSubscriptionPlan(data: FormData) {
    const supabase = await createClient()
    const name = data.get('name') as string

    // Helper to cleanup price string (e.g. "490,-" -> 490, "490,50" -> 490.5)
    // We duplicate this here or could move to a shared helper if needed, 
    // but for now keeping it local to avoid file sprawl.
    const parsePrice = (val: FormDataEntryValue | null) => {
        if (!val) return 0
        let s = val.toString().trim()
        s = s.replace(/kr/gi, '').replace(/-/g, '').trim()
        s = s.replace(/,/g, '.')
        return parseFloat(s) || 0
    }
    const price = parsePrice(data.get('price'))

    const description = data.get('description') as string

    if (!name) return { error: 'Navn er påkrevd' }
    if (isNaN(price)) return { error: 'Pris må være et tall' }

    const { error } = await supabase
        .from('subscription_plans')
        .insert({ name, price, description })

    if (error) return { error: error.message }
    revalidatePath('/superadmin/settings/plans')
    return { success: true }
}

export async function updateSubscriptionPlan(id: string, data: FormData) {
    const supabase = await createClient()
    const name = data.get('name') as string

    // Use same parsing logic
    const parsePrice = (val: FormDataEntryValue | null) => {
        if (!val) return 0
        let s = val.toString().trim()
        s = s.replace(/kr/gi, '').replace(/-/g, '').trim()
        s = s.replace(/,/g, '.')
        return parseFloat(s) || 0
    }
    const price = parsePrice(data.get('price'))

    const description = data.get('description') as string

    if (!name) return { error: 'Navn er påkrevd' }
    if (isNaN(price)) return { error: 'Pris må være et tall' }

    const { error } = await supabase
        .from('subscription_plans')
        .update({ name, price, description, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/superadmin/settings/plans')
    return { success: true }
}

export async function deleteSubscriptionPlan(id: string) {
    const supabase = await createClient()

    // Check usage? For now hard delete or set active=false
    // Let's set active=false
    const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/superadmin/settings/plans')
    return { success: true }
}
