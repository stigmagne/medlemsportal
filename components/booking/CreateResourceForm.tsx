"use client"

import ResourceForm from "./ResourceForm"

export default function CreateResourceForm({ orgSlug }: { orgSlug: string }) {
    return <ResourceForm orgSlug={orgSlug} />
}
