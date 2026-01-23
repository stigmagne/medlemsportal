import { getResources, toggleResourceStatus } from "./actions"
import CreateResourceForm from "@/components/booking/CreateResourceForm"
import ResourceActions from "@/components/booking/ResourceActions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { revalidatePath } from "next/cache"

export default async function ResourcesPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const resources = await getResources(slug)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ressurser</h1>
                <p className="text-muted-foreground">
                    Administrer lokaler og utstyr som kan bookes av medlemmer.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Eksisterende ressurser</h2>
                    <div className="space-y-6">
                        {resources.length === 0 ? (
                            <p className="text-muted-foreground italic">Ingen ressurser opprettet ennå.</p>
                        ) : (
                            // Group by Category using a Set
                            Array.from(new Set(resources.map(r => r.category))).map(category => (
                                <div key={category} className="space-y-3">
                                    <h3 className="font-medium text-sm uppercase text-muted-foreground tracking-wider">{category}</h3>
                                    {resources.filter(r => r.category === category).map((resource) => (
                                        <Card key={resource.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                                                        <CardDescription>{resource.description || "Ingen beskrivelse"}</CardDescription>
                                                    </div>
                                                    <Badge variant={resource.is_active ? "default" : "secondary"}>
                                                        {resource.is_active ? "Aktiv" : "Inaktiv"}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="text-sm">
                                                <div className="flex justify-between py-1">
                                                    <span className="text-muted-foreground">Pris:</span>
                                                    <span className="font-medium">
                                                        {resource.price},-
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            ({resource.price_type === 'hourly' ? 'pr time' : resource.price_type === 'daily' ? 'pr dag' : 'fastpris'})
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-1">
                                                    <span className="text-muted-foreground">Krever godkjenning:</span>
                                                    <span className="font-medium">{resource.requires_approval ? "Ja" : "Nei"}</span>
                                                </div>

                                                <div className="pt-4 flex justify-end gap-2">
                                                    <ResourceActions resource={resource} orgSlug={slug} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <CreateResourceForm orgSlug={slug} />
                </div>
            </div>
        </div>
    )
}
