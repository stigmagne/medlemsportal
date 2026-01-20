import { getAvailableResources, getUserBookings, cancelBooking } from "./actions"
import BookingForm from "@/components/booking/BookingForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

// Client component wrapper for cancellation to handle revalidation/interactive
import CancelBookingButton from "@/components/booking/CancelBookingButton"

export default async function BookingPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const resources = await getAvailableResources(slug)
    const myBookings = await getUserBookings(slug)

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Ressursbooking</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Her kan du booke klubbhus, møterom og felles utstyr.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column: Form */}
                <div>
                    <BookingForm resources={resources} orgSlug={slug} />
                </div>

                {/* Right Column: My Bookings */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mine reservasjoner</h2>

                    {myBookings.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center text-gray-500">
                            Ingen reservasjoner funnet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myBookings.map((booking) => (
                                <div key={booking.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {booking.resource?.name || "Ukjent ressurs"}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(booking.start_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant={
                                            booking.status === 'confirmed' ? 'default' :
                                                booking.status === 'cancelled' ? 'destructive' : 'secondary'
                                        }>
                                            {booking.status === 'confirmed' ? 'Bekreftet' :
                                                booking.status === 'cancelled' ? 'Avlyst' :
                                                    booking.status === 'pending' ? 'Venter' : booking.status}
                                        </Badge>
                                    </div>

                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex justify-between">
                                            <span>Tid:</span>
                                            <span className="font-medium">
                                                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {booking.description && (
                                            <div className="mt-2 text-xs italic text-gray-500">
                                                "{booking.description}"
                                            </div>
                                        )}
                                    </div>

                                    {booking.status !== 'cancelled' && (
                                        <div className="pt-2 border-t mt-1">
                                            <CancelBookingButton
                                                bookingId={booking.id}
                                                orgSlug={slug}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
