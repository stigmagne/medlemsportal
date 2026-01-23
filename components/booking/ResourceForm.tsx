"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createResource, updateResource, Resource } from "@/app/org/[slug]/(dashboard)/booking/ressurser/actions"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? "Lagre endringer" : "Opprett ressurs"}
        </Button>
    )
}

interface ResourceFormProps {
    orgSlug: string
    resource?: Resource // If present, edit mode
    onSuccess?: () => void
}

export default function ResourceForm({ orgSlug, resource, onSuccess }: ResourceFormProps) {
    const { toast } = useToast()
    const isEditing = !!resource

    async function handleSubmit(formData: FormData) {
        let result
        if (isEditing) {
            result = await updateResource(null, formData)
        } else {
            result = await createResource(null, formData)
        }

        if (result?.error) {
            toast({
                title: "Feil",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: isEditing ? "Ressurs oppdatert" : "Ressurs opprettet",
                description: "Endringene er lagret."
            })
            if (!isEditing) {
                // Reset form only on create
                const form = document.getElementById("resource-form") as HTMLFormElement
                form?.reset()
            }
            if (onSuccess) onSuccess()
        }
    }

    return (
        <form id="resource-form" action={handleSubmit} className="space-y-4 max-w-lg border p-6 rounded-lg bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium">{isEditing ? "Rediger ressurs" : "Legg til ny ressurs"}</h3>
            <input type="hidden" name="org_slug" value={orgSlug} />
            {isEditing && <input type="hidden" name="id" value={resource.id} />}

            <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                    id="category"
                    name="category"
                    list="category-list"
                    placeholder="F.eks. Lokaler, Utstyr, Kjøretøy"
                    defaultValue={resource?.category || "Annet"}
                    required
                />
                <datalist id="category-list">
                    <option value="Lokaler" />
                    <option value="Utstyr" />
                    <option value="Båter" />
                    <option value="Kjøretøy" />
                    <option value="Annet" />
                </datalist>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Navn på ressurs</Label>
                <Input id="name" name="name" placeholder="F.eks. Klubbhus, Projektor, Bane 1" defaultValue={resource?.name} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea id="description" name="description" placeholder="Beskriv ressursen, regler for bruk etc." defaultValue={resource?.description || ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Pris (kr)</Label>
                    <Input
                        id="price"
                        name="price"
                        type="number"
                        defaultValue={resource?.price || 0}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price_type">Pristype</Label>
                    <select
                        id="price_type"
                        name="price_type"
                        defaultValue={resource?.price_type || "hourly"}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="hourly">Per time</option>
                        <option value="daily">Per dag</option>
                        <option value="fixed">Fastpris (per booking)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <Label htmlFor="payment_due_days">Betalingsfrist (dager før)</Label>
                    <Input
                        id="payment_due_days"
                        name="payment_due_days"
                        type="number"
                        defaultValue={resource?.payment_due_days || 14}
                        min="0"
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                    <Switch id="requires_time" name="requires_time" defaultChecked={resource ? resource.requires_time : true} />
                    <Label htmlFor="requires_time">Krever tidsvalg (klokkeslett)</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch id="requires_approval" name="requires_approval" defaultChecked={resource ? resource.requires_approval : false} />
                    <Label htmlFor="requires_approval">Krever godkjenning av admin</Label>
                </div>
            </div>

            <div className="pt-4">
                <SubmitButton isEditing={isEditing} />
            </div>
        </form>
    )
}
