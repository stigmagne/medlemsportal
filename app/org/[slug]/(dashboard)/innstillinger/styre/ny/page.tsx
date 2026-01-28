import { createClient } from "@/lib/supabase/server"
import { requireOrgAccess } from "@/lib/auth/helpers"
import { BoardMemberForm } from "@/components/board/BoardMemberForm"

export default async function NewBoardPositionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const { orgId } = await requireOrgAccess(slug, 'org_admin')
    const supabase = await createClient()

    // Fetch active members for selection
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
                    <h1 className="text-2xl font-bold tracking-tight">Nytt styreverv</h1>
                    <p className="text-muted-foreground">Legg til et nytt medlem i styret.</p>
                </div>
            </div>

            <BoardMemberForm orgSlug={slug} members={members || []} />
        </div>
    )
}
