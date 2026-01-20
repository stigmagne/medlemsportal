import { getPublishedVolunteeringEvents } from "./actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, ClockIcon, UserIcon } from "lucide-react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import Link from "next/link"

export default async function VolunteeringPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const events = await getPublishedVolunteeringEvents(slug)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dugnader & Vakter</h1>
                <p className="text-muted-foreground">
                    Her kan du melde deg på ledige vakter og bidra til fellesskapet.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg border border-dashed">
                        <h3 className="text-lg font-medium">Ingen dugnader tilgjengelig</h3>
                        <p className="text-muted-foreground mt-2">Det er ingen publiserte dugnader akkurat nå. Sjekk igjen senere!</p>
                    </div>
                ) : (
                    events.map((event) => {
                        const isFull = (event.filled_count || 0) >= (event.total_capacity || 0)
                        const isSignedUp = !!event.user_assignment_status

                        return (
                            <Card key={event.id} className="flex flex-col h-full">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                                        {isSignedUp && (
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                Påmeldt
                                            </Badge>
                                        )}
                                        {!isSignedUp && isFull && (
                                            <Badge variant="secondary">Fulltegnet</Badge>
                                        )}
                                    </div>
                                    <CardDescription className="line-clamp-2">
                                        {event.description || "Ingen beskrivelse"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                        <span>
                                            {format(new Date(event.start_time), "d. MMMM yyyy", { locale: nb })}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <ClockIcon className="mr-2 h-4 w-4 opacity-70" />
                                        <span>
                                            {format(new Date(event.start_time), "HH:mm", { locale: nb })} - {format(new Date(event.end_time), "HH:mm", { locale: nb })}
                                        </span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPinIcon className="mr-2 h-4 w-4 opacity-70" />
                                            <span>{event.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-muted-foreground">
                                        <UserIcon className="mr-2 h-4 w-4 opacity-70" />
                                        <span>
                                            {event.filled_count} / {event.total_capacity} plasser fylt
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t mt-auto">
                                    <Link href={`/org/${slug}/min-side/dugnad/${event.id}`} className="w-full">
                                        <Button
                                            className="w-full"
                                            variant={isSignedUp ? "secondary" : "default"}
                                        >
                                            {isSignedUp ? "Se din vakt" : "Se vakter og meld på"}
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
