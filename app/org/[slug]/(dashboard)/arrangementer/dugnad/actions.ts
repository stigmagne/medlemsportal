"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type VolunteeringEvent = {
    id: string
    title: string
    description: string | null
    start_time: string
    end_time: string
    location: string | null
    needs_approval: boolean
    is_published: boolean
    filled_count?: number
    total_capacity?: number
}

export async function getVolunteeringEvents(orgSlug: string) {
    const supabase = await createClient()

    // First get org id from slug
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single()

    if (!org) return []

    const { data: events, error } = await supabase
        .from("volunteering_events")
        .select(`
      *,
      roles:volunteering_roles(
        capacity,
        filled_count
      )
    `)
        .eq("org_id", org.id)
        .order("start_time", { ascending: true })

    if (error) {
        console.error("Error fetching volunteering events:", error)
        return []
    }

    // Calculate capacity usage
    return events.map((event: any) => {
        const totalCapacity = event.roles?.reduce((acc: number, role: any) => acc + (role.capacity || 0), 0) || 0
        const filledCount = event.roles?.reduce((acc: number, role: any) => acc + (role.filled_count || 0), 0) || 0

        return {
            ...event,
            total_capacity: totalCapacity,
            filled_count: filledCount
        } as VolunteeringEvent
    })
}

export async function createVolunteeringEvent(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const startTime = formData.get("start_time") as string
    const endTime = formData.get("end_time") as string
    const location = formData.get("location") as string
    const orgId = formData.get("org_id") as string
    const orgSlug = formData.get("org_slug") as string

    if (!title || !startTime || !endTime || !orgId) {
        return { error: "Mangler påkrevde felt" }
    }

    const { data, error } = await supabase
        .from("volunteering_events")
        .insert({
            org_id: orgId,
            title,
            description,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            location,
            is_published: false // Draft by default
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/org/${orgSlug}/arrangementer/dugnad`)
    return { success: true, eventId: data.id }
}
