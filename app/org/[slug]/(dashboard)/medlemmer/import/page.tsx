import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ImportWizard from './ImportWizard'

export default async function ImportPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get organization details by slug
    const { data: organization } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    const org_id = organization.id

    // Verify admin access
    const { data: userAccess } = await supabase
        .from('user_org_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', org_id)

    if (!userAccess || userAccess.length === 0) {
        redirect('/')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Importer medlemmer
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Last opp en CSV-fil for å legge til flere medlemmer samtidig.
                </p>
            </div>

            <ImportWizard org_id={org_id} slug={slug} />
        </div>
    )
}
