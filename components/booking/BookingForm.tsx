"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBooking } from "@/app/org/[slug]/min-side/booking/actions"
import { Resource } from "@/app/org/[slug]/(dashboard)/booking/ressurser/actions"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Book Ressurs
        </Button>
    )
}

export default function BookingForm({
    resources,
    orgSlug
}: {
    resources: Resource[]
    orgSlug: string
}) {
    const { toast } = useToast()

    async function handleSubmit(formData: FormData) {
        const result = await createBooking(null, formData)

        if (result?.error) {
            toast({
                title: "Booking feilet",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: "Booking bekreftet",
                description: "Din reservasjon er registrert."
            })
            const form = document.getElementById("booking-form") as HTMLFormElement
            form?.reset()
        }
    }

    if (resources.length === 0) {
        return (
            <div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-muted-foreground">Ingen ressurser tilgjengelig for booking.</p>
            </div>
        )
    }

    return (
        <form id="booking-form" action={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium mb-4">Gjør en ny booking</h3>
            <input type="hidden" name="org_slug" value={orgSlug} />

            <div className="space-y-2">
                <Label htmlFor="resource_id">Velg ressurs</Label>
                <Select name="resource_id" required>
                    <SelectTrigger>
                        <SelectValue placeholder="Velg hva du vil booke" />
                    </SelectTrigger>
                    <SelectContent>
                        {resources.map(res => (
                            <SelectItem key={res.id} value={res.id}>
                                {res.name} ({res.hourly_rate > 0 ? `${res.hourly_rate} kr/t` : 'Gratis'})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="date">Dato</Label>
                <Input type="date" name="date" required min={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start_time">Starttid</Label>
                    <Input type="time" name="start_time" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end_time">Sluttid</Label>
                    <Input type="time" name="end_time" required />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Formål (valgfritt)</Label>
                <Textarea name="description" placeholder="Hva skal rommet/utstyret brukes til?" />
            </div>

            <div className="pt-4">
                <SubmitButton />
            </div>
        </form>
    )
}
