import { getCaseSettings } from './actions'
import CaseSettingsForm from './CaseSettingsForm'

export default async function CaseSettingsPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const settings = await getCaseSettings(slug)

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Saksinnstillinger</h1>
            <p className="text-gray-500 mb-8">
                Konfigurer hvordan saker skal nummereres og behandles.
            </p>

            <CaseSettingsForm settings={settings} slug={slug} />
        </div>
    )
}
