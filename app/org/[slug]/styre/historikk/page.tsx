import { createClient } from "@/lib/supabase/server"
import { BoardMemberCard, PublicBoardMember } from "@/components/board/BoardMemberCard"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function PublicBoardHistoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch org name
    const { data: org } = await supabase.from('organizations').select('id, name').eq('slug', slug).single()
    if (!org) notFound()

    // Fetch history
    const { data: allPositions, error } = await supabase.rpc('get_board_history', {
        target_slug: slug
    })

    if (error) {
        console.error('Error fetching board history:', error)
    }

    // Filter out currently active members to show only history, or show all with visual distinction? 
    // "Historikk" usually implies past members. 
    // Let's show everything but grouped by "Tidligere styremedlemmer" vs "Sittende styre" if we wanted, 
    // but the main page shows active. So let's show INACTIVE here, or just a full timeline.
    // Let's filter for inactive for "Historikk" to be distinct from main page, or list by year.
    // A simple chronological list (newest first) seems best for history.

    // Group by term start year for better organization
    const groupedHistory = (allPositions as any[])?.reduce((groups, pos) => {
        const year = new Date(pos.term_start_date).getFullYear()
        if (!groups[year]) groups[year] = []
        groups[year].push(pos)
        return groups
    }, {} as Record<string, PublicBoardMember[]>)

    const years = Object.keys(groupedHistory || {}).sort((a, b) => Number(b) - Number(a))

    return (
        <div className="container mx-auto py-12 px-4 space-y-12 max-w-6xl">
            <div className="relative">
                <Button variant="ghost" className="absolute left-0 top-1" asChild>
                    <Link href={`/org/${slug}/styre`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Tilbake til dagens styre
                    </Link>
                </Button>
                <div className="text-center space-y-4 pt-12 md:pt-0">
                    <h1 className="text-4xl font-bold tracking-tight">Styrehistorikk for {org.name}</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Oversikt over tidligere styremedlemmer og verv.
                    </p>
                </div>
            </div>

            <div className="space-y-16">
                {years.map(year => (
                    <div key={year} className="space-y-6">
                        <h2 className="text-2xl font-bold border-b pb-2">{year}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {groupedHistory[year].map((pos) => (
                                <div key={pos.position_id} className={pos.term_end_date ? 'opacity-75' : ''}>
                                    <BoardMemberCard member={pos} />
                                    <div className="mt-2 text-sm text-center text-muted-foreground">
                                        {new Date(pos.term_start_date).getFullYear()} - {pos.term_end_date ? new Date(pos.term_end_date).getFullYear() : 'Nå'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {(!allPositions || allPositions.length === 0) && (
                <div className="text-center text-muted-foreground py-12">
                    Ingen historikk funnet.
                </div>
            )}
        </div>
    )
}
