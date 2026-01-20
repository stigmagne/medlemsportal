"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createVolunteeringEvent } from "@/app/org/[slug]/(dashboard)/arrangementer/dugnad/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function CreateVolunteeringEventForm({ orgId, orgSlug }: { orgId: string, orgSlug: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.append("org_id", orgId)
        formData.append("org_slug", orgSlug)

        try {
            const result = await createVolunteeringEvent(null, formData)

            if (result?.error) {
                toast({
                    title: "Feil oppstod",
                    description: result.error,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Vaktliste opprettet",
                    description: "Du blir nå videresendt...",
                })
                // Redirect happens in action or client side? Action revalidates, we can push.
                // But action didn't return redirect.
                router.push(`/org/${orgSlug}/arrangementer/dugnad/${result.eventId}`)
            }
        } catch (error) {
            toast({
                title: "Ukjent feil",
                description: "Noe gikk galt ved opprettelse.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Ny Vaktliste / Dugnad</CardTitle>
                <CardDescription>
                    Opprett et nytt arrangement som krever frivillige eller vakter.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Navn på dugnad / vaktliste</Label>
                        <Input id="title" name="title" placeholder="F.eks. Kioskvakt 17. mai" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beskrivelse</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Beskriv hva som skal gjøres, oppmøtested osv."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Starttidspunkt</Label>
                            <Input id="start_time" name="start_time" type="datetime-local" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">Sluttidspunkt</Label>
                            <Input id="end_time" name="end_time" type="datetime-local" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Sted</Label>
                        <Input id="location" name="location" placeholder="F.eks. Klubbhusets kafeteria" />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Avbryt
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Opprett
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
