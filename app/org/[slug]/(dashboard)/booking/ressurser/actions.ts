"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Resource = {
    id: string
    name: string
    description: string | null
    requires_approval: boolean
    price: number
    price_type: 'hourly' | 'daily' | 'fixed'
    requires_time: boolean
    payment_due_days: number
    is_active: boolean
}

// ... getResources ...
export async function getResources(orgSlug: string) {
    const supabase = await createClient()

    // Get org id
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single()

    if (!org) return []

    const { data: resources, error } = await supabase
        .from("resources")
        .select("*")
        .eq("org_id", org.id)
        .order("name")

    if (error) {
        console.error("Error fetching resources:", JSON.stringify(error, null, 2))
        return []
    }

    return resources as Resource[]
}

export async function createResource(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const price = parseFloat(formData.get("price") as string) || 0
    const priceType = formData.get("price_type") as string || 'hourly'
    const requiresApproval = formData.get("requires_approval") === "on"
    const requiresTime = formData.get("requires_time") === "on"
    const paymentDueDays = parseInt(formData.get("payment_due_days") as string) || 14
    const orgSlug = formData.get("org_slug") as string

    // Get org id
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single()

    if (!org) return { error: "Fant ikke organisasjon" }

    const { error } = await supabase
        .from("resources")
        .insert({
            org_id: org.id,
            name,
            description,
            price,
            price_type: priceType,
            requires_approval: requiresApproval,
            requires_time: requiresTime,
            payment_due_days: paymentDueDays,
            is_active: true
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/org/${orgSlug}/booking/ressurser`)
    return { success: true }
}

export async function toggleResourceStatus(resourceId: string, isActive: boolean, orgSlug: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("resources")
        .update({ is_active: isActive })
        .eq("id", resourceId)

    if (error) return { error: "Kunne ikke oppdatere status" }

    revalidatePath(`/org/${orgSlug}/booking/ressurser`)
    return { success: true }
}
