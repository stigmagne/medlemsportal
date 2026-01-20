import { getVolunteeringEventDetails } from "../actions"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, MapPinIcon, ClockIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import Link from "next/link"
import SignupButton from "./SignupButton" // Client component for interactivity

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ slug: string; eventId: string }>
}) {
    const { slug, eventId } = await params
    const event = await getVolunteeringEventDetails(eventId)

    if (!event) {
        notFound()
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link
                href={`/org/${slug}/min-side/dugnad`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake til oversikt
            </Link>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                            <div className="flex items-center">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(new Date(event.start_time), "d. MMMM yyyy", { locale: nb })}
                            </div>
                            <div className="flex items-center">
                                <ClockIcon className="mr-2 h-4 w-4" />
                                {format(new Date(event.start_time), "HH:mm", { locale: nb })} - {format(new Date(event.end_time), "HH:mm", { locale: nb })}
                            </div>
                            {event.location && (
                                <div className="flex items-center">
                                    <MapPinIcon className="mr-2 h-4 w-4" />
                                    {event.location}
                                </div>
                            )}
                        </div>
                    </div>
                    <Badge variant={event.is_published ? "default" : "secondary"}>
                        {event.is_published ? "Påmelding åpen" : "Utkast"}
                    </Badge>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <p>{event.description}</p>
                </div>
            </div>

            <Separator />

            <div>
                <h2 className="text-xl font-semibold mb-4">Ledige vakter</h2>
                <div className="grid gap-4">
                    {event.roles.map((role: any) => {
                        const isFull = role.filled_count >= role.capacity
                        const myAssignment = role.my_assignment

                        return (
                            <Card key={role.id}>
                                <CardHeader className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">{role.title}</CardTitle>
                                            <CardDescription>
                                                {role.filled_count} av {role.capacity} plasser fylt
                                            </CardDescription>
                                        </div>
                                        <SignupButton
                                            roleId={role.id}
                                            assignmentId={myAssignment?.id}
                                            isFull={isFull}
                                            isSignedUp={!!myAssignment}
                                            orgSlug={slug}
                                        />
                                    </div>
                                </CardHeader>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
