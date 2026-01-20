"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cancelBooking } from "@/app/org/[slug]/min-side/booking/actions"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function CancelBookingButton({
    bookingId,
    orgSlug
}: {
    bookingId: string
    orgSlug: string
}) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    async function handleCancel() {
        if (!confirm("Er du sikker på at du vil avbestille?")) return

        setLoading(true)
        const result = await cancelBooking(bookingId, orgSlug)

        if (result?.error) {
            toast({
                title: "Feil",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: "Avbestilt",
                description: "Reservasjonen din er kansellert."
            })
        }
        setLoading(false)
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-auto font-normal text-xs"
            onClick={handleCancel}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Avbestill
        </Button>
    )
}
