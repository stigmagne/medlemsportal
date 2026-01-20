"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createResource } from "@/app/org/[slug]/(dashboard)/booking/ressurser/actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Opprett ressurs
        </Button>
    )
}

export default function CreateResourceForm({ orgSlug }: { orgSlug: string }) {
    const [open, setOpen] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        const result = await createResource(null, formData)

        if (result?.error) {
            toast({
                title: "Feil",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: "Ressurs opprettet",
                description: "Ressursen er nå tilgjengelig for booking."
            })
            // Reset form or close modal? For now just simple page reload via revalidate
            // Ideally we'd reset the form fields.
            const form = document.getElementById("create-resource-form") as HTMLFormElement
            form?.reset()
        }
    }

    return (
        <form id="create-resource-form" action={handleSubmit} className="space-y-4 max-w-lg border p-6 rounded-lg bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium">Legg til ny ressurs</h3>
            <input type="hidden" name="org_slug" value={orgSlug} />

            <div className="space-y-2">
                <Label htmlFor="name">Navn på ressurs</Label>
                <Input id="name" name="name" placeholder="F.eks. Klubbhus, Projektor, Bane 1" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea id="description" name="description" placeholder="Beskriv ressursen, regler for bruk etc." />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Pris per time (kr)</Label>
                    <Input
                        id="hourly_rate"
                        name="hourly_rate"
                        type="number"
                        defaultValue="0"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                    <Switch id="requires_approval" name="requires_approval" />
                    <Label htmlFor="requires_approval">Krever godkjenning</Label>
                </div>
            </div>

            <div className="pt-4">
                <SubmitButton />
            </div>
        </form>
    )
}
