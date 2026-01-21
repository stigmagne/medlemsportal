import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import SmsComposer from "./SmsComposer"

export default async function SmsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Get Org
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single()

    if (!org) notFound()

    // 2. Check Access (Must be admin/superadmin to see this page)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/auth/login")

    // We rely on middleware/layout for general security, but good to be explicit for features involving cost.

    // 3. Fetch Member Stats for Groups
    // For now we just get total count.
    const { count: totalMembers } = await supabase
        .from("members")
        .select("*", { count: 'exact', head: true })
        .eq("organization_id", org.id)
        .eq("status", "active")
        .is("deleted_at", null)

    // Mock groups for now (until we implement advanced filters)
    const groups = [
        { id: "adults", label: "Voksne (Mock)", count: Math.floor((totalMembers || 0) * 0.6) },
        { id: "kids", label: "Barn/Ungdom (Mock)", count: Math.floor((totalMembers || 0) * 0.4) }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Send SMS</h1>
                <p className="text-muted-foreground">
                    Send viktige beskjeder direkte til medlemmenes mobiltelefon.
                </p>
            </div>

            <SmsComposer
                orgId={org.id}
                groups={groups}
                totalMembers={totalMembers || 0}
            />
        </div>
    )
}
