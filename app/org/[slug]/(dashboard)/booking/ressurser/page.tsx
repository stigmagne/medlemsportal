import { getResources, toggleResourceStatus } from "./actions"
import CreateResourceForm from "@/components/booking/CreateResourceForm"
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
                    <div className="space-y-4">
                        {resources.length === 0 ? (
                            <p className="text-muted-foreground italic">Ingen ressurser opprettet ennå.</p>
                        ) : (
                            resources.map((resource) => (
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
                                            <span className="text-muted-foreground">Pris per time:</span>
                                            <span className="font-medium">{resource.hourly_rate},-</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-muted-foreground">Krever godkjenning:</span>
                                            <span className="font-medium">{resource.requires_approval ? "Ja" : "Nei"}</span>
                                        </div>
                                        {/* Actions could go here, e.g. Edit button */}
                                    </CardContent>
                                </Card>
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
