import { createClient } from '@/lib/supabase/server'
import { getOrgFamilies } from '@/app/actions/families'
import FamilyCard from '@/components/families/FamilyCard'
import CreateFamilyModal from '@/components/families/CreateFamilyModal'

export default async function FamiliesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Verify access and get org id
    const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!org) return <div>Ikke funnet</div>

    const families = await getOrgFamilies(slug)

    // Fetch potential members for the modal (those NOT in a family)
    const { data: availableMembers } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('org_id', org.id)
        .is('family_id', null)
        .is('deleted_at', null)
        .order('first_name')

    const totalFamilies = families.length
    const totalMembersInFamilies = families.reduce((sum, f) => sum + f.family_members.length, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Familier</h1>
                    <p className="text-muted-foreground">
                        Totalt: {totalFamilies} familier | {totalMembersInFamilies} medlemmer i familier
                    </p>
                </div>
                <CreateFamilyModal
                    orgId={org.id}
                    availableMembers={availableMembers || []}
                />
            </div>

            <div className="grid gap-6">
                {families.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ingen familier enda</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Opprett en familie for å samle fakturaer.</p>
                    </div>
                ) : (
                    families.map((family: any) => (
                        <FamilyCard key={family.id} family={family} orgSlug={slug} />
                    ))
                )}
            </div>
        </div>
    )
}
