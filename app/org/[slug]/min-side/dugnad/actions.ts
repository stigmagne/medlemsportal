"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type VolunteeringAssignment = {
    id: string
    user_id: string
    role_id: string
    status: string
    role?: {
        event_id: string
    }
}

export type VolunteeringRole = {
    id: string
    title: string
    capacity: number
    event_id: string
    assignments?: { count: number }[]
    filled_count?: number
    my_assignment?: {
        id: string
        status: string
    } | null
}

export type VolunteeringEvent = {
    id: string
    title: string
    description: string | null
    start_time: string
    end_time: string
    location: string | null
    needs_approval: boolean
    roles?: VolunteeringRole[]
    filled_count?: number
    total_capacity?: number
    user_assignment_status?: string | null
}

export async function getPublishedVolunteeringEvents(orgSlug: string) {
    const supabase = await createClient()

    // 1. Get Org ID
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single()

    if (!org) return []

    // 2. Get User ID (to check if already signed up)
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Fetch Published Events
    const { data: events, error } = await supabase
        .from("volunteering_events")
        .select(`
            *,
            roles:volunteering_roles(
                id,
                capacity,
                assignments:volunteering_assignments(count)
            )
        `)
        .eq("org_id", org.id)
        .eq("is_published", true)
        .order("start_time", { ascending: true })

    if (error) {
        console.error("Error fetching published volunteering events:", error)
        return []
    }

    // 4. Calculate stats and check user status
    // Note: We need a separate query or join to check specific user assignment status efficiently, 
    // but for now we iterate or could fetch user assignments separately.

    // Let's fetch user assignments for these events to see if "I am signed up"
    let userAssignments: VolunteeringAssignment[] = []
    if (user) {
        const eventIds = events.map(e => e.id)
        if (eventIds.length > 0) {
            // We need to match assignments via roles. 
            // Logic: assignment -> role -> event
            // Query: assignments where user_id = me and role.event_id in eventIds
            const { data: ua } = await supabase
                .from("volunteering_assignments")
                .select(`
                    id,
                    user_id,
                    role_id,
                    status,
                    role:volunteering_roles(
                        event_id
                    )
                `)
                .eq("user_id", user.id)
            // Ideally filter by event IDs but via join it's complex in one go without flattened ID list.
            // We'll filter in memory or assume list is small.

            // Supabase sometimes infers relationships as arrays in types, but runtime it's an object for N:1.
            // We cast to any first to avoid conflict, then to our type.
            userAssignments = (ua as any) || []
        }
    }

    return events.map((event: any) => {
        // Calculate capacities
        let totalCapacity = 0
        let totalFilled = 0

        event.roles?.forEach((role: any) => {
            totalCapacity += role.capacity || 0
            // count is returned as array of objects { count: n } or similar depending on supabase setup?
            // Actually .select(..., assignments(count)) returns [{count: n}] usually.
            // Wait, Supabase .select('assignments(count)') does exact count.
            // Let's check the shape. Usually it is `assignments: [{ count: 1 }]` if using exact.
            // But `select(..., assignments(count))` syntax returns exact count as `assignments[0].count`.

            // For simplicity in this iteration, let's assume we use a simpler approach or fix the query if needed.
            // Supabase "count" in select: `assignments:volunteering_assignments(count)` returns `assignments: [{ count: 123 }]`

            const filled = role.assignments?.[0]?.count || 0
            totalFilled += filled
        })

        // Check if user has an assignment for this event
        const myAssignment = userAssignments.find((ua: any) => ua.role?.event_id === event.id)

        return {
            id: event.id,
            title: event.title,
            description: event.description,
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location,
            needs_approval: event.needs_approval,
            total_capacity: totalCapacity,
            filled_count: totalFilled,
            user_assignment_status: myAssignment?.status || null
        } as VolunteeringEvent
    })
}

export async function getVolunteeringEventDetails(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: event, error } = await supabase
        .from("volunteering_events")
        .select(`
            *,
            roles:volunteering_roles(
                id,
                title,
                capacity,
                assignments:volunteering_assignments(count)
            )
        `)
        .eq("id", eventId)
        .single()

    if (error || !event) return null

    // Fetch user's assignments for this event
    const { data: myAssignments } = await supabase
        .from("volunteering_assignments")
        .select(`
            id,
            user_id,
            role_id,
            status
        `)
        .eq("user_id", user.id)

    // We can't easily filter by event_id here without join, but we can filter in memory since we only care about this event's roles.

    // Process roles to include filled count and user status
    // Process roles to include filled count and user status
    const processedRoles = event.roles.map((role: VolunteeringRole) => {
        const filled = role.assignments?.[0]?.count || 0
        const myAssignment = myAssignments?.find((ua: VolunteeringAssignment) => ua.role_id === role.id)

        return {
            ...role,
            filled_count: filled,
            my_assignment: myAssignment ? {
                id: myAssignment.id,
                status: myAssignment.status
            } : null
        }
    })

    return {
        ...event,
        roles: processedRoles.sort((a: VolunteeringRole, b: VolunteeringRole) => a.title.localeCompare(b.title))
    }
}

export async function signupForRole(roleId: string, orgSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Du må være logget inn." }
    }

    // 1. Check capacity
    const { data: role } = await supabase
        .from("volunteering_roles")
        .select("capacity, event_id")
        .eq("id", roleId)
        .single()

    if (!role) return { error: "Rollen finnes ikke." }

    const { count } = await supabase
        .from("volunteering_assignments")
        .select("*", { count: 'exact', head: true })
        .eq("role_id", roleId)
        .in("status", ["approved", "pending"]) // Count pending as taking a spot? Usually yes to avoid overbooking.

    if ((count || 0) >= role.capacity) {
        return { error: "Denne vakten er fulltegnet." }
    }

    // 2. Check if already signed up for this event (prevent double booking same time?)
    // For now, let's just create the assignment.

    const { error } = await supabase
        .from("volunteering_assignments")
        .insert({
            role_id: roleId,
            user_id: user.id,
            status: "pending" // Or approved by default? Let's use pending as safe default from schema.
        })

    if (error) {
        console.error("Signup error:", error)
        return { error: "Kunne ikke melde deg på. Prøv igjen." }
    }

    revalidatePath(`/org/${orgSlug}/min-side/dugnad`)
    revalidatePath(`/org/${orgSlug}/min-side/dugnad/${role.event_id}`)
    return { success: true }
}

export async function cancelAssignment(assignmentId: string, orgSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from("volunteering_assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("user_id", user.id) // Security check

    if (error) return { error: "Kunne ikke melde deg av." }

    revalidatePath(`/org/${orgSlug}/min-side/dugnad`)
    // We don't have eventId here easily without fetching, but revalidating the list is good start.
    // Ideally we return eventId to revalidate the detail page too.
    return { success: true }
}
