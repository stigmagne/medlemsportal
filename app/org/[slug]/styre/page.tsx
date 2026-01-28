import { createClient } from "@/lib/supabase/server"
import { BoardMemberCard, PublicBoardMember } from "@/components/board/BoardMemberCard"
import { notFound } from "next/navigation"

export default async function PublicBoardPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch org name
    const { data: org } = await supabase.from('organizations').select('id, name').eq('slug', slug).single()
    if (!org) notFound()

    // Use RPC to fetch public board data
    const { data: positions, error } = await supabase.rpc('get_public_board_members', {
        target_slug: slug
    })

    if (error) {
        console.error('Error fetching board members:', error)
    }

    return (
        <div className="container mx-auto py-12 px-4 space-y-12 max-w-6xl">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Styret i {org.name}</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Her finner du oversikt over styrets sammensetning og kontaktinformasjon.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(positions as PublicBoardMember[])?.map((pos) => (
                    <BoardMemberCard key={pos.position_id} member={pos} />
                ))}
            </div>

            {(!positions || positions.length === 0) && (
                <div className="text-center text-muted-foreground py-12">
                    Ingen styremedlemmer er registrert offentlig ennå.
                </div>
            )}
        </div>
    )
}
