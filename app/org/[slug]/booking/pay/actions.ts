"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function createStripeSession(bookingId: string, orgSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Get booking
    const { data: booking } = await supabase
        .from("resource_bookings")
        .select(`
            *,
            resource:resources(name)
        `)
        .eq("id", bookingId)
        .single()

    if (!booking) return { error: "Booking not found" }

    // Allow payment if price > 0. If 0, maybe confirm? But this function implies payment.
    if (booking.total_price <= 0) return { error: "Booking is free" }

    // Create Stripe Session
    const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "nok",
                        product_data: {
                            name: `Booking: ${booking.resource.name}`,
                            description: `${new Date(booking.start_time).toLocaleString()} - ${new Date(booking.end_time).toLocaleString()}`
                        },
                        unit_amount: Math.round(booking.total_price * 100), // cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/org/${orgSlug}/booking/pay/${bookingId}?success=true`,
            cancel_url: `${origin}/org/${orgSlug}/booking/pay/${bookingId}?canceled=true`,
            metadata: {
                booking_id: bookingId,
                org_slug: orgSlug,
                user_id: user.id
            },
            customer_email: user.email // Prefill email
        })

        // Update booking with session ID
        await supabase
            .from("resource_bookings")
            .update({ stripe_session_id: session.id })
            .eq("id", bookingId)

        return { url: session.url }

    } catch (error: any) {
        console.error("Stripe error:", error)
        return { error: error.message }
    }
}
