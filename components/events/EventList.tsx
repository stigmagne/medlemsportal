'use client'

import Link from 'next/link'

interface Event {
    id: string
    title: string
    event_date: string
    location?: string
    registrations: { count: number }[]
    status: string
}

export default function EventList({ events, slug }: { events: Event[], slug: string }) {
    if (!events || events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-4">Ingen arrangementer funnet.</p>
                <Link
                    href={`/org/${slug}/dashboard/arrangementer/ny`}
                    className="text-blue-600 hover:underline font-medium"
                >
                    Opprett det første arrangementet
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {events.map(event => (
                <div key={event.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/org/${slug}/dashboard/arrangementer/${event.id}`}>
                                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                                    {event.title}
                                </h3>
                            </Link>
                            <div className="text-sm text-gray-500 mt-1 space-y-1">
                                <p>📅 {new Date(event.event_date).toLocaleString('nb-NO', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                {event.location && <p>📍 {event.location}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {event.registrations[0]?.count || 0} påmeldte
                            </div>
                            <div className="mt-2">
                                <Link
                                    href={`/org/${slug}/dashboard/arrangementer/${event.id}`}
                                    className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded-md bg-white hover:bg-gray-50"
                                >
                                    Administrer
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
