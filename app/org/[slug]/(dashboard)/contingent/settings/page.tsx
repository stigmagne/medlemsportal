import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMembershipFees } from '../actions'
import FeeSettings from './FeeSettings'

export default async function ContingentSettingsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: organization } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!organization) redirect('/')

    const fees = await getMembershipFees(slug)

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-5 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Innstillinger for Kontingent
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Definer hvilke medlemskapstyper og årskontingenter som er gjeldende.
                    </p>
                </div>
                <Link
                    href={`/org/${slug}/contingent`}
                    className="text-sm text-blue-600 hover:text-blue-500"
                >
                    ← Tilbake til oversikt
                </Link>
            </div>

            <FeeSettings fees={fees} orgSlug={slug} />
        </div>
    )
}
