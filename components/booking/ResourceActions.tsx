"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteResource, Resource } from "@/app/org/[slug]/(dashboard)/booking/ressurser/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ResourceForm from "./ResourceForm"
import { Trash2, Edit2 } from "lucide-react"

export default function ResourceActions({ resource, orgSlug }: { resource: Resource, orgSlug: string }) {
    const [editOpen, setEditOpen] = useState(false)

    async function handleDelete() {
        if (confirm("Er du sikker på at du vil slette denne ressursen?")) {
            await deleteResource(resource.id, orgSlug)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-1" />
                        Rediger
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rediger ressurs</DialogTitle>
                    </DialogHeader>
                    <ResourceForm
                        orgSlug={orgSlug}
                        resource={resource}
                        onSuccess={() => setEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    )
}
