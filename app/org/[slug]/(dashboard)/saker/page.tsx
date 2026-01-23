import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function CasesPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    // Get org id
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!org) return <div>Fant ikke organisasjon</div>

    // Fetch cases
    const { data: cases } = await supabase
        .from('case_items')
        .select('*')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false })

    const openCases = cases?.filter(c => c.status !== 'decided' && c.status !== 'dismissed') || []
    const decidedCases = cases?.filter(c => c.status === 'decided' || c.status === 'dismissed') || []

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Saker</h1>
                    <p className="text-gray-500">Oversikt over saker og vedtak</p>
                </div>
                <Link
                    href={`/org/${slug}/saker/ny`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Opprett ny sak
                </Link>
            </div>

            {/* Open Cases */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Åpne saker / Under behandling
                    </h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {openCases.length === 0 ? (
                        <li className="px-4 py-4 sm:px-6 text-gray-500 text-center italic">
                            Ingen åpne saker
                        </li>
                    ) : (
                        openCases.map((c) => (
                            <li key={c.id}>
                                <Link href={`/org/${slug}/saker/${c.id}`} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-blue-600 truncate">
                                                #{c.formatted_id} {c.title}
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {c.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    {c.origin === 'meeting' ? 'Styresak' : 'Hurtigvedtak/E-post'}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    Opprettet {new Date(c.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Decided Cases */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md opacity-75">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Avgjorte saker (Arkiv)
                    </h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {decidedCases.length === 0 ? (
                        <li className="px-4 py-4 sm:px-6 text-gray-500 text-center italic">
                            Ingen avgjorte saker
                        </li>
                    ) : (
                        decidedCases.map((c) => (
                            <li key={c.id}>
                                <Link href={`/org/${slug}/saker/${c.id}`} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-600 truncate">
                                                #{c.formatted_id} {c.title}
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    {c.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    )
}
