import { createClient } from "@/lib/supabase/server"
import { requireOrgAccess } from "@/lib/auth/helpers"
import { BoardMemberForm } from "@/components/board/BoardMemberForm"
import { notFound } from "next/navigation"

export default async function EditBoardPositionPage({ params }: { params: { slug: string; id: string } }) {
    const { orgId } = await requireOrgAccess(params.slug, 'org_admin')
    const supabase = await createClient()

    // Fetch position
    const { data: position } = await supabase
        .from('board_positions')
        .select('*')
        .eq('id', params.id)
        .eq('organization_id', orgId)
        .single()

    if (!position) notFound()

    // Fetch members
    const { data: members } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('organization_id', orgId)
        .eq('membership_status', 'active')
        .order('first_name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rediger styreverv</h1>
                    <p className="text-muted-foreground">Endre informasjon for valgt styremedlem.</p>
                </div>
            </div>

            <BoardMemberForm orgSlug={params.slug} members={members || []} initialData={position} />
        </div>
    )
}
