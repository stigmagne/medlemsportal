import { createClient } from "@/lib/supabase/server"
import { requireOrgAccess } from "@/lib/auth/helpers"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function BoardSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const { orgId } = await requireOrgAccess(slug, 'org_admin')
    const supabase = await createClient()

    const { data: positions } = await supabase
        .from('board_positions')
        .select(`
            *,
            members (
                first_name,
                last_name,
                email,
                image_url
            )
        `)
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Styreverv</h1>
                    <p className="text-muted-foreground">Administrer styrets sammensetning og roller.</p>
                </div>
                <Button asChild>
                    <Link href={`/org/${slug}/innstillinger/styre/ny`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Legg til verv
                    </Link>
                </Button>
            </div>

            <div className="border rounded-lg bg-card">
                <div className="p-4 bg-muted/50 border-b font-medium grid grid-cols-12 gap-4">
                    <div className="col-span-4">Navn</div>
                    <div className="col-span-3">Rolle</div>
                    <div className="col-span-3">Periode</div>
                    <div className="col-span-2 text-right">Handlinger</div>
                </div>
                {(!positions || positions.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        Ingen styreverv registrert ennå.
                    </div>
                )}
                {positions?.map((position: any) => (
                    <div key={position.id} className="p-4 border-b last:border-0 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center gap-3">
                            <div>
                                <div className="font-medium">{position.members?.first_name} {position.members?.last_name}</div>
                                <div className="text-sm text-muted-foreground">{position.members?.email}</div>
                            </div>
                        </div>
                        <div className="col-span-3">
                            <div className="font-medium capitalize">{position.position_type}</div>
                            {position.position_title && <div className="text-sm text-muted-foreground">{position.position_title}</div>}
                        </div>
                        <div className="col-span-3 text-sm">
                            {new Date(position.term_start_date).toLocaleDateString()} - {position.term_end_date ? new Date(position.term_end_date).toLocaleDateString() : 'Ubestemt'}
                        </div>
                        <div className="col-span-2 text-right">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/org/${slug}/innstillinger/styre/${position.id}`}>Rediger</Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
