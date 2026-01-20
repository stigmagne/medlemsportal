import NewCaseForm from './NewCaseForm'
import Link from 'next/link'

export default async function NewCasePage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href={`/org/${slug}/saker`} className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block">
                    ← Tilbake til oversikt
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Opprett ny sak</h1>
            </div>

            <NewCaseForm slug={slug} />
        </div>
    )
}
