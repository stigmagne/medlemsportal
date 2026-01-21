import { createClient } from '@/lib/supabase/server'
import { getMemberExpenses } from '@/app/actions/expenses'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function MyExpensesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()

    if (!org) return <div>Fant ikke organisasjon</div>

    const expenses = await getMemberExpenses(org.id)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Mine utlegg og reiseregninger</h1>
                <Link
                    href={`/org/${slug}/minside/utlegg/ny`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                    + Nytt utlegg
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historikk</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dato</TableHead>
                                <TableHead>Beskrivelse</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Beløp</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                        Ingen utlegg registrert.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense: any) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>
                                            {new Date(expense.travel_date).toLocaleDateString('nb-NO')}
                                        </TableCell>
                                        <TableCell>
                                            <div>{expense.description}</div>
                                            {expense.event && (
                                                <div className="text-xs text-gray-500">
                                                    Event: {expense.event.title}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {expense.transport_type === 'car' ? 'Egen bil' :
                                                expense.transport_type === 'public' ? 'Kollektiv' :
                                                    expense.transport_type === 'flight' ? 'Fly' : 'Annet'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {Number(expense.total_amount).toFixed(2)} kr
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                expense.status === 'paid' ? 'default' :
                                                    expense.status === 'rejected' ? 'destructive' : 'secondary'
                                            }>
                                                {expense.status === 'paid' ? 'Utbetalt' :
                                                    expense.status === 'rejected' ? 'Avvist' :
                                                        expense.status === 'approved' ? 'Godkjent' : 'Innsendt'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
