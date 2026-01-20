"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Resource } from "@/app/org/[slug]/(dashboard)/booking/ressurser/actions"

export type Booking = {
    id: string
    resource_id: string
    start_time: string
    end_time: string
    status: "pending" | "confirmed" | "rejected" | "cancelled"
    description: string | null
    resource?: Resource // Joined
}

export async function getAvailableResources(orgSlug: string) {
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
        .eq("is_active", true)
        .order("name")

    if (error) {
        console.error("Error fetching available resources:", error)
        return []
    }

    return resources as Resource[]
}

export async function getUserBookings(orgSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get org id
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single()

    if (!org) return []

    const { data: bookings, error } = await supabase
        .from("resource_bookings")
        .select(`
            *,
            resource:resources(*)
        `)
        .eq("org_id", org.id)
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })

    if (error) {
        console.error("Error fetching user bookings:", error)
        return []
    }

    return bookings as Booking[]
}

export async function createBooking(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Du må være logget inn." }

    const resourceId = formData.get("resource_id") as string
    const date = formData.get("date") as string
    const startTime = formData.get("start_time") as string
    const endTime = formData.get("end_time") as string
    const description = formData.get("description") as string
    const orgSlug = formData.get("org_slug") as string

    // Validate inputs
    if (!resourceId || !date || !startTime || !endTime) {
        return { error: "Alle felt må fylles ut." }
    }

    // Parse dates
    // Date format: YYYY-MM-DD
    // Time format: HH:mm
    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(`${date}T${endTime}:00`)

    if (endDateTime <= startDateTime) {
        return { error: "Sluttidspunkt må være etter starttidspunkt." }
    }

    // Get org id
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single()

    if (!org) return { error: "Organisasjon ikke funnet." }

    // Check for collisions
    // "Overlaps" logic: (StartA < EndB) and (EndA > StartB)
    const { data: collisions, error: collisionError } = await supabase
        .from("resource_bookings")
        .select("id")
        .eq("resource_id", resourceId)
        .in("status", ["pending", "confirmed"]) // Ignore cancelled/rejected
        .lt("start_time", endDateTime.toISOString())
        .gt("end_time", startDateTime.toISOString())

    if (collisionError) {
        console.error("Collision check error:", collisionError)
        return { error: "Kunne ikke sjekke tilgjengelighet." }
    }

    if (collisions && collisions.length > 0) {
        return { error: "Ressursen er allerede booket i dette tidsrommet." }
    }

    // Insert booking
    const { error } = await supabase
        .from("resource_bookings")
        .insert({
            org_id: org.id,
            resource_id: resourceId,
            user_id: user.id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            description,
            status: "confirmed" // Default to confirmed for now, ideally 'pending' if requiring approval
        })

    if (error) {
        console.error("Booking creation error:", error)
        return { error: "Kunne ikke opprette booking." }
    }

    revalidatePath(`/org/${orgSlug}/minside/booking`)
    return { success: true }
}

export async function cancelBooking(bookingId: string, orgSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from("resource_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("user_id", user.id) // Ensure ownership

    if (error) return { error: "Kunne ikke avbestille." }

    revalidatePath(`/org/${orgSlug}/minside/booking`)
    return { success: true }
}
