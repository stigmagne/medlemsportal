import { createClient } from '@/lib/supabase/server'
import { getOrgSettings } from '@/app/actions/settings'
import { getMemberTypes } from '@/app/actions/member-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SettingsForm from './SettingsForm'
import RenewalCard from './RenewalCard'
import MemberTypesCard from './MemberTypesCard'

export default async function SettingsPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: org } = await supabase.from('organizations').select('id, name').eq('slug', slug).single()
    if (!org) return <div>Fant ikke organisasjon</div>

    const settings = await getOrgSettings(slug)
    const memberTypes = await getMemberTypes(slug)

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Innstillinger</h1>
                <p className="text-gray-500">Administrer foreningens oppsett</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <SettingsForm
                    orgId={org.id}
                    initialFee={settings?.membership_fee || 0}
                    initialAccountNumber={settings?.account_number || ''}
                    initialContactEmail={settings?.contact_email || ''}
                    memberTypes={memberTypes}
                />
                <MemberTypesCard orgId={org.id} slug={slug} initialTypes={memberTypes} />

                <RenewalCard orgId={org.id} />

                <Card>
                    <CardHeader>
                        <CardTitle>Saksbehandling</CardTitle>
                        <CardDescription>
                            Konfigurer saksnummerering og moduler.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={`/org/${slug}/innstillinger/saker`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 border border-gray-200 font-medium w-full"
                        >
                            Gå til innstillinger for saker
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
