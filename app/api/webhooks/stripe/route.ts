import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get("Stripe-Signature") as string

    let event: Stripe.Event

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            // If secret is missing, we can't verify signature.
            // For dev/test without CLI, we might bypass? No, dangerous.
            // We return 200 to avoid retries if we can't process it, or 500.
            console.error("Missing STRIPE_WEBHOOK_SECRET")
            return new NextResponse("Missing Webhook Secret", { status: 500 })
        }
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session

        // Ensure metadata exists
        if (session.metadata?.booking_id) {
            const bookingId = session.metadata.booking_id

            const supabase = await createClient()

            const { error } = await supabase
                .from("resource_bookings")
                .update({
                    payment_status: "paid",
                    stripe_session_id: session.id,
                    stripe_payment_intent_id: session.payment_intent as string
                })
                .eq("id", bookingId)

            if (error) {
                console.error("Error updating booking payment status:", error)
                return new NextResponse("Database Error", { status: 500 })
            }
        }
    }

    return new NextResponse(null, { status: 200 })
}
