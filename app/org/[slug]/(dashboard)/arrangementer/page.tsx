import { getEvents } from '@/app/actions/events'
import EventList from '@/components/events/EventList'
import Link from 'next/link'

export default async function EventsPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ tab?: string }>
}) {
    const { slug } = await params
    const { tab } = await searchParams
    const activeTab = tab === 'past' ? 'past' : 'upcoming'

    // getEvents uses requireOrgAccess internally for security
    const events = await getEvents(slug, activeTab)

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Arrangementer</h1>
                    <p className="text-gray-500 mt-1">Administrer påmeldinger og arrangementer</p>
                </div>
                <Link
                    href={`/org/${slug}/arrangementer/ny`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                    + Nytt arrangement
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <Link
                        href={`/org/${slug}/arrangementer?tab=upcoming`}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'upcoming'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Kommende
                    </Link>
                    <Link
                        href={`/org/${slug}/arrangementer?tab=past`}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'past'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Tidligere
                    </Link>
                </nav>
            </div>

            <EventList events={events} slug={slug} />
        </div>
    )
}
