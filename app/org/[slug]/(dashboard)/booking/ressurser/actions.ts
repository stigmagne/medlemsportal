"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Resource = {
    id: string
    name: string
    description: string | null
    requires_approval: boolean
    hourly_rate: number
    is_active: boolean
}

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
    const hourlyRate = parseFloat(formData.get("hourly_rate") as string) || 0
    const requiresApproval = formData.get("requires_approval") === "on"
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
            hourly_rate: hourlyRate,
            requires_approval: requiresApproval,
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
