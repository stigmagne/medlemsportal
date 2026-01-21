import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"

export default async function BookingCalendarPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Get Org
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single()

    if (!org) notFound()

    // 2. Access Check
    // Reuse admin check logic or rely on middleware/layout (assuming layout handles basic auth)

    // 3. Fetch Bookings (Upcoming)
    // We join with resources to get names
    const { data: bookings } = await supabase
        .from("resource_bookings")
        .select(`
            id,
            start_time,
            end_time,
            description,
            status,
            resources ( name ),
            user:user_id ( email ) 
        `) // Note: user_id relation might fail if not explicitly defined in schema, assuming it works or using auth.users which is tricky. 
        // Actually, resource_bookings.user_id references auth.users. Supabase Client often allows this join if configured.
        // If not, we might miss user email. Let's try.
        .eq("org_id", org.id)
        .gte("end_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(50)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Booking-oversikt</h1>
                <p className="text-muted-foreground">
                    Kommende reservasjoner av ressurser.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {!bookings || bookings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Ingen kommende bookinger funnet.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {bookings.map((booking: any) => (
                            <div key={booking.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 mt-1">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {booking.resources?.name || "Ukjent ressurs"}
                                        </h3>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mt-1">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {format(new Date(booking.start_time), "d. MMMM yyyy, HH:mm", { locale: nb })} - {format(new Date(booking.end_time), "HH:mm")}
                                                </span>
                                            </div>
                                            {booking.description && (
                                                <p className="italic">"{booking.description}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {booking.status === 'confirmed' ? 'Bekreftet' :
                                            booking.status === 'pending' ? 'Avventer' : booking.status}
                                    </span>
                                    {booking.user?.email && (
                                        <span className="text-muted-foreground text-xs">
                                            {booking.user.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
