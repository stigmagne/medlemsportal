import { Suspense } from "react"
import Link from "next/link"
import { getVolunteeringEvents } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Calendar, MapPin, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

export default async function VolunteeringPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const events = await getVolunteeringEvents(slug)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vaktlister & Dugnad</h1>
                    <p className="text-muted-foreground">
                        Administrer dugnader og vaktlister for arrangementer.
                    </p>
                </div>
                <Link href={`/org/${slug}/arrangementer/dugnad/ny`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Opprett Vaktliste
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <Card key={event.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                                <Badge variant={event.is_published ? "default" : "secondary"}>
                                    {event.is_published ? "Publisert" : "Utkast"}
                                </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                                {event.description || "Ingen beskrivelse"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>
                                    {format(new Date(event.start_time), "d. MMMM yyyy", { locale: nb })}
                                </span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <MapPin className="mr-2 h-4 w-4" />
                                <span>{event.location || "Ingen sted oppgitt"}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <Users className="mr-2 h-4 w-4" />
                                <span>
                                    {event.filled_count} / {event.total_capacity} vakter fylt
                                </span>
                            </div>

                            {/* Progress bar could go here */}
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all"
                                    style={{ width: `${Math.min(100, (event.filled_count || 0) / (event.total_capacity || 1) * 100)}%` }}
                                />
                            </div>

                        </CardContent>
                        <CardFooter className="pt-4 border-t">
                            <Link href={`/org/${slug}/arrangementer/dugnad/${event.id}`} className="w-full">
                                <Button variant="outline" className="w-full">
                                    Administrer
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {events.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-center bg-muted/20">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Ingen dugnader ennå</h3>
                        <p className="text-muted-foreground mb-6">
                            Opprett din første dugnad eller vaktliste for å komme i gang.
                        </p>
                        <Link href={`/org/${slug}/arrangementer/dugnad/ny`}>
                            <Button>Opprett Vaktliste</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
