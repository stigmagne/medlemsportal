import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { PrintButton } from '@/components/print-button'

export default async function InvoicePrintPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch organization
    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!org) redirect('/')

    // Fetch transaction
    const { data: payment } = await supabase
        .from('payment_transactions')
        .select(`
            *,
            member:members (
                first_name,
                last_name,
                address,
                postal_code,
                city,
                email
            )
        `)
        .eq('id', id)
        .single()

    if (!payment) {
        return <div>Faktura ikke funnet.</div>
    }

    // Simple print layout
    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0 max-w-3xl mx-auto">
            <style type="text/css" media="print">
                {`@page { size: auto; margin: 20mm; }`}
            </style>

            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-bold mb-2 text-gray-900">FAKTURA</h1>
                    <p className="text-gray-600">Fakturanr: #{payment.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-gray-600">Dato: {format(new Date(payment.created_at), 'dd.MM.yyyy')}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{org.name}</h2>
                    <p>{org.contact_email}</p>
                    {/* Add more org details if available */}
                </div>
            </div>

            <div className="flex justify-between mb-12">
                <div>
                    <h3 className="font-bold text-gray-700 uppercase text-sm mb-2">Til:</h3>
                    <p className="font-medium">{payment.member?.first_name} {payment.member?.last_name}</p>
                    <p>{payment.member?.address}</p>
                    <p>{payment.member?.postal_code} {payment.member?.city}</p>
                    <p>{payment.member?.email}</p>
                </div>
            </div>

            <table className="w-full mb-12 border-collapse">
                <thead>
                    <tr className="border-b-2 border-gray-900">
                        <th className="text-left py-2 font-bold uppercase text-sm">Beskrivelse</th>
                        <th className="text-right py-2 font-bold uppercase text-sm">Beløp</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200">
                        <td className="py-4">{payment.description || 'Betaling'}</td>
                        <td className="text-right py-4">{Number(payment.amount).toFixed(2)} kr</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td className="pt-4 text-right font-bold text-xl uppercase">Total</td>
                        <td className="pt-4 text-right font-bold text-xl">{Number(payment.amount).toFixed(2)} kr</td>
                    </tr>
                    <tr>
                        <td className="pt-2 text-right text-gray-600 uppercase text-sm">Inkl. mva</td>
                        <td className="pt-2 text-right text-gray-600 text-sm">0.00 kr</td>
                    </tr>
                </tfoot>
            </table>

            <div className="border-t-2 border-gray-900 pt-4 mb-12">
                <div className="flex justify-between">
                    <div>
                        <p className="font-bold mb-2">Betalingsinformasjon:</p>
                        {payment.status === 'pending' && (payment.kid || org.account_number) ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                {payment.due_date && (
                                    <p className="mb-2">
                                        <span className="font-medium">Forfallsdato:</span>{' '}
                                        {format(new Date(payment.due_date), 'dd.MM.yyyy')}
                                    </p>
                                )}
                                {org.account_number && (
                                    <p className="mb-1">
                                        <span className="font-medium">Kontonummer:</span>{' '}
                                        <span className="font-mono text-lg">{org.account_number}</span>
                                    </p>
                                )}
                                {payment.kid && (
                                    <p className="mb-1">
                                        <span className="font-medium">KID:</span>{' '}
                                        <span className="font-mono text-lg font-bold">{payment.kid}</span>
                                    </p>
                                )}
                                <p className="mb-1">
                                    <span className="font-medium">Beløp:</span>{' '}
                                    <span className="font-mono text-lg">{Number(payment.amount).toFixed(2)} kr</span>
                                </p>
                                <p className="text-sm text-gray-600 mt-3 italic">
                                    Bruk KID-nummeret ved betaling for automatisk registrering.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p>Betalt via: {payment.payment_method === 'invoice' ? 'Faktura/Bank' : payment.provider || 'Stripe/Kort'}</p>
                                <p>Status: {payment.status === 'paid' || payment.status === 'captured' ? 'BETALT' : payment.status.toUpperCase()}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <PrintButton />
            {/* Auto print script */}
            <script dangerouslySetInnerHTML={{
                __html: `
                // Optional: window.onload = function() { window.print(); }
            `}} />
        </div>
    )
}
