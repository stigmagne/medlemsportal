import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CreateVolunteeringEventForm } from "@/components/volunteering/CreateVolunteeringEventForm"

export default async function NewVolunteeringPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Verify org access and retrieve ID
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single()

    if (!org) {
        notFound()
    }

    return (
        <div className="container mx-auto py-6">
            <CreateVolunteeringEventForm orgId={org.id} orgSlug={slug} />
        </div>
    )
}
