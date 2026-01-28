import { getCase } from './actions'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

export default async function CaseDetailsPage({
    params
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const caseItem = await getCase(id, slug)

    if (!caseItem) notFound()

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <Link href={`/org/${slug}/saker/ny`} className="hover:text-gray-900">
                        ← Alle saker (placeholder)
                    </Link>
                    <span>/</span>
                    <span>Sak {caseItem.formatted_id}</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-gray-100 text-gray-800 text-xs font-mono font-semibold px-2.5 py-0.5 rounded">
                                #{caseItem.formatted_id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${caseItem.origin === 'email' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                {caseItem.origin === 'email' ? 'E-postvedtak' : 'Møtesak'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">{caseItem.title}</h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Beskrivelse / Bakgrunn</h3>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {caseItem.description || 'Ingen beskrivelse.'}
                        </p>

                        {/* Attachments */}
                        {caseItem.attachments && caseItem.attachments.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Vedlegg</h4>
                                <ul className="space-y-2">
                                    {caseItem.attachments.map((att: any, idx: number) => (
                                        <li key={idx} className="text-sm">
                                            <a href={att.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                {att.name || 'Dokument lenke'}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Decision (if Email) or Meeting link (if Meeting) */}
                    {caseItem.origin === 'email' ? (
                        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-green-900">Vedtak</h3>
                                <span className="text-xs text-green-700">
                                    Behandlet: {format(new Date(caseItem.decided_at), 'd. MMM yyyy', { locale: nb })}
                                </span>
                            </div>
                            <p className="text-green-800 whitespace-pre-wrap">{caseItem.decision}</p>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-2">Behandling</h3>
                            {caseItem.meetings ? (
                                <p className="text-blue-800">
                                    Saken skal behandles i møtet: <br />
                                    <Link href={`/org/${slug}/moter/${caseItem.meetings.id}`} className="font-semibold hover:underline">
                                        {caseItem.meetings.title} ({format(new Date(caseItem.meetings.meeting_date), 'd. MMM yyyy', { locale: nb })})
                                    </Link>
                                </p>
                            ) : (
                                <p className="text-blue-800 text-sm">
                                    Denne saken er foreløpig ikke knyttet til et møte.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Actions */}
                    {caseItem.voting_enabled && caseItem.status === 'open' && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h4 className="font-semibold text-purple-900 mb-2">Digital Avstemning</h4>
                            <p className="text-sm text-purple-800 mb-4">
                                Denne saken krever digital avstemning fra styret.
                            </p>
                            <Link
                                href={`/org/${slug}/saker/${id}/avstemning`}
                                className="block w-full text-center py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium shadow-sm transition-colors"
                            >
                                Gå til avstemning
                            </Link>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status</h4>
                        <div className="flex flex-col gap-2">
                            <div>
                                <span className="text-sm font-medium text-gray-900 capitalize block">
                                    {caseItem.status === 'draft' ? 'Utkast / Til behandling' : caseItem.status === 'decided' ? 'Ferdigbehandlet' : caseItem.status}
                                </span>
                            </div>
                            {caseItem.case_year && (
                                <div>
                                    <span className="text-xs text-gray-500 block">Saksår</span>
                                    <span className="text-sm text-gray-900">{caseItem.case_year}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
