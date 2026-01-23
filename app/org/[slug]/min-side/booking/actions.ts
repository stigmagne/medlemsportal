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

import { sendEmail } from "@/lib/email/client"
import { calculateBookingFee, PriceType } from "@/lib/payments/booking-fees"
import { redirect } from "next/navigation"

// ... types ...

// ... getAvailableResources ...

// ... createBooking ...
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

    // Fetch Resource Details (Price, Approval)
    const { data: resource } = await supabase
        .from("resources")
        .select("*")
        .eq("id", resourceId)
        .single()

    if (!resource) return { error: "Ressurs ikke funnet." }

    // Check for collisions
    const { data: collisions, error: collisionError } = await supabase
        .from("resource_bookings")
        .select("id")
        .eq("resource_id", resourceId)
        .in("status", ["pending", "confirmed"])
        .lt("start_time", endDateTime.toISOString())
        .gt("end_time", startDateTime.toISOString())

    if (collisionError) {
        console.error("Collision check error:", collisionError)
        return { error: "Kunne ikke sjekke tilgjengelighet." }
    }

    if (collisions && collisions.length > 0) {
        return { error: "Ressursen er allerede booket i dette tidsrommet." }
    }

    // Calculate Price
    const price = calculateBookingFee(startDateTime, endDateTime, resource.price, resource.price_type as PriceType)
    const requiresPayment = price > 0

    // Determine Status
    // If pending payment -> status 'pending' (until paid? or confirmed but payment pending?)
    // Usually: 'confirmed' but 'payment_status': 'pending'.
    // If resource requires approval -> status 'pending'.
    let status = "confirmed"
    let paymentStatus = requiresPayment ? "pending" : "paid" // or null/none

    if (resource.requires_approval) {
        status = "pending"
    }

    // Insert booking
    const { data: booking, error } = await supabase
        .from("resource_bookings")
        .insert({
            org_id: org.id,
            resource_id: resourceId,
            user_id: user.id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            description,
            status,
            total_price: price,
            payment_status: paymentStatus,
            // Calculate due date if needed (e.g. 14 days before start, or now)
            payment_due_date: requiresPayment ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .select()
        .single()

    if (error) {
        console.error("Booking creation error:", error)
        return { error: "Kunne ikke opprette booking." }
    }

    // Send Payment Email
    if (requiresPayment && booking) {
        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/org/${orgSlug}/booking/pay/${booking.id}`

        await sendEmail({
            to: user.email!, // Assumes user has email
            subject: `Betaling for booking: ${resource.name}`,
            html: `
                <h1>Bekreft din booking</h1>
                <p>Hei,</p>
                <p>Du har reservert <strong>${resource.name}</strong>.</p>
                <p><strong>Tidspunkt:</strong> ${startDateTime.toLocaleString()} - ${endDateTime.toLocaleString()}</p>
                <p><strong>Beløp å betale:</strong> ${price},- NOK</p>
                <p>Vennligst betal innen fristen for å bekrefte bookingen:</p>
                <a href="${paymentLink}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">
                    Gå til betaling
                </a>
                <p>Mvh,<br/>Din Forening</p>
            `,
            organizationId: org.id
        })
    }


    revalidatePath(`/org/${orgSlug}/minside/booking`)

    if (requiresPayment) {
        // Redirect to payment page
        redirect(`/org/${orgSlug}/booking/pay/${booking.id}`)
    }

    return { success: true, message: status === 'pending' ? "Booking sendt til godkjenning." : "Booking bekreftet." }
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
