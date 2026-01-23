"use client"

import { Button } from "@/components/ui/button"
import { createStripeSession } from "../actions" // parent directory
import { Loader2, CreditCard } from "lucide-react"
import { useFormStatus } from "react-dom"
import { useState } from "react"

export default function PayButton({ bookingId, orgSlug }: { bookingId: string, orgSlug: string }) {
    const [loading, setLoading] = useState(false)

    async function handlePay() {
        setLoading(true)
        const res = await createStripeSession(bookingId, orgSlug)
        if (res?.url) {
            window.location.href = res.url
        } else {
            alert("Kunne ikke starte betaling: " + res?.error)
            setLoading(false)
        }
    }

    return (
        <Button onClick={handlePay} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Betal nå
        </Button>
    )
}
