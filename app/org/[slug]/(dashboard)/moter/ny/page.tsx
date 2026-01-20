import NewMeetingForm from './NewMeetingForm'
import { useTranslations } from 'next-intl'

export default async function NewMeetingPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nytt møte</h1>
                <p className="text-gray-500">Planlegg et nytt møte og send innkallinger.</p>
            </div>

            <NewMeetingForm slug={slug} />
        </div>
    )
}
