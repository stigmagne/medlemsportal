import { createClient } from '@/lib/supabase/server'
import { getEventDetails } from '@/app/actions/events'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EventDetailsPage({
    params
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const supabase = await createClient()

    // Fetch event with registration stats
    const event = await getEventDetails(id)
    if (!event) notFound()

    // Fetch registrations
    const { data: registrations } = await supabase
        .from('event_registrations')
        .select(`
            *,
            member:members(name, email),
            products:event_registration_products(
                quantity,
                product:event_products(name)
            )
        `)
        .eq('event_id', id)
        .order('registered_at', { ascending: false })

    // Calculate stats
    const totalParticipants = registrations?.length || 0
    const totalIncome = registrations?.reduce((sum, reg) => sum + Number(reg.total_amount), 0) || 0
    const paidCount = registrations?.filter(r => r.payment_status === 'paid').length || 0

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/org/${slug}/dashboard/arrangementer`}
                    className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block"
                >
                    ← Tilbake til oversikt
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                        <div className="flex gap-4 mt-2 text-gray-600">
                            <span>📅 {new Date(event.event_date).toLocaleString('nb-NO', { dateStyle: 'long', timeStyle: 'short' })}</span>
                            <span>📍 {event.location || 'Ikke spesifisert'}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/arrangementer/${event.id}/pamelding`}
                            target="_blank"
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2"
                        >
                            <span>🔗</span> Vis påmeldingsside
                        </Link>
                        {/* Edit button placeholder */}
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Rediger
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Påmeldte</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        {totalParticipants}
                        <span className="text-sm text-gray-400 font-normal ml-2">
                            / {event.max_participants || '∞'}
                        </span>
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Innbetalt</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {totalIncome.toLocaleString('nb-NO')} kr
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Betalingsstatus</h3>
                    <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Betalt</span>
                            <span className="font-medium bg-green-100 text-green-800 px-2 rounded-full">{paidCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Venter</span>
                            <span className="font-medium bg-yellow-100 text-yellow-800 px-2 rounded-full">{totalParticipants - paidCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendee List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Deltakerliste</h2>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Last ned Excel
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Navn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produkter</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beløp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Handling</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {registrations?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Ingen påmeldinger enda.
                                    </td>
                                </tr>
                            ) : (
                                registrations?.map((reg) => (
                                    <tr key={reg.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {reg.member?.name || reg.non_member_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {reg.member?.email || reg.non_member_email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.member_id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {reg.member_id ? 'Medlem' : 'Gjest'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {reg.products?.map((p: any) => (
                                                    <div key={p.product.name}>
                                                        {p.quantity}x {p.product.name}
                                                    </div>
                                                ))}
                                                {(!reg.products || reg.products.length === 0) && '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {reg.total_amount} kr
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.payment_status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {reg.payment_status === 'paid' ? 'Betalt' : 'Venter'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900">Rediger</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
