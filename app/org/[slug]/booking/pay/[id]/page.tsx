import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import PayButton from "./PayButton" // separate client component for interactivity

export default async function BookingPaymentPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string; id: string }>
    searchParams: Promise<{ success?: string; canceled?: string }>
}) {
    const { slug, id } = await params
    const { success, canceled } = await searchParams

    const supabase = await createClient()

    const { data: booking } = await supabase
        .from("resource_bookings")
        .select(`
            *,
            resource:resources(name, description)
        `)
        .eq("id", id)
        .single()

    if (!booking) return <div>Booking ikke funnet</div>

    const isPaid = booking.payment_status === 'paid' || success === 'true'

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Betaling for Booking</CardTitle>
                    <CardDescription>
                        {booking.resource.name}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                        <div className="flex justify-between">
                            <span>Start:</span>
                            <span className="font-medium">{new Date(booking.start_time).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Slutt:</span>
                            <span className="font-medium">{new Date(booking.end_time).toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                            <span>Totalt:</span>
                            <span>{booking.total_price},- NOK</span>
                        </div>
                    </div>

                    {isPaid ? (
                        <div className="flex flex-col items-center justify-center text-green-600 py-4 gap-2">
                            <CheckCircle2 className="w-12 h-12" />
                            <p className="font-medium">Betaling gjennomført!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {canceled && (
                                <div className="text-red-500 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Betalingen ble avbrutt. Prøv igjen.
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground">
                                For å bekrefte din booking må du betale beløpet.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    {!isPaid && (
                        <PayButton bookingId={id} orgSlug={slug} />
                    )}
                    <Button variant="ghost" asChild className="w-full">
                        <Link href={`/org/${slug}/minside/booking`}>
                            Tilbake til mine bookinger
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
