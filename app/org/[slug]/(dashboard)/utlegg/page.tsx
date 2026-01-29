import { getExpensesForAdmin } from '@/app/actions/expenses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AdminExpenseActions from './AdminExpenseActions'
// Force recompile

export default async function AdminExpensesPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ status?: string }>
}) {
    const { slug } = await params
    const { status } = await searchParams

    const currentStatus = (status as any) || 'all'
    const expenses = await getExpensesForAdmin(slug, currentStatus)

    const pendingCount = await getExpensesForAdmin(slug, 'submitted').then(res => res.length)
    const totalAmountPending = expenses
        .filter(e => e.status === 'submitted')
        .reduce((sum, e) => sum + Number(e.total_amount), 0)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Reiseregninger</h1>
                    <p className="text-gray-500">Administrer utlegg og refusjoner</p>
                </div>
                <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700 uppercase font-semibold">Til godkjenning</p>
                    <p className="text-xl font-bold text-yellow-900">{pendingCount} stk ({totalAmountPending.toFixed(0)} kr)</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex gap-2 text-sm">
                        <a href={`?status=all`} className={`px-3 py-1 rounded-full ${currentStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>Alle</a>
                        <a href={`?status=submitted`} className={`px-3 py-1 rounded-full ${currentStatus === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>Til godkjenning</a>
                        <a href={`?status=approved`} className={`px-3 py-1 rounded-full ${currentStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>Godkjent</a>
                        <a href={`?status=paid`} className={`px-3 py-1 rounded-full ${currentStatus === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>Utbetalt</a>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dato</TableHead>
                                <TableHead>Medlem</TableHead>
                                <TableHead>Beskrivelse</TableHead>
                                <TableHead>Beløp</TableHead>
                                <TableHead>Vedlegg</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Handling</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        Ingen utlegg funnet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense: any) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>
                                            {new Date(expense.travel_date).toLocaleDateString('nb-NO')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{expense.member?.name}</div>
                                            {/* Bank account encrypted in DB, NOT shown to approvers - only in PDF for kasserer */}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate" title={expense.description}>
                                                {expense.description}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {expense.transport_type} {expense.distance_km > 0 ? `(${expense.distance_km} km)` : ''}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {Number(expense.total_amount).toFixed(2)} kr
                                        </TableCell>
                                        <TableCell>
                                            {expense.receipt_url ? (
                                                <a
                                                    href={expense.receipt_url}
                                                    target="_blank"
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    Vis fil
                                                </a>
                                            ) : <span className="text-gray-400 text-xs">-</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                expense.status === 'paid' ? 'default' :
                                                    expense.status === 'rejected' ? 'destructive' :
                                                        expense.status === 'approved' ? 'default' : 'secondary'
                                            } className={expense.status === 'approved' ? 'bg-green-600' : ''}>
                                                {expense.status === 'paid' ? 'Utbetalt' :
                                                    expense.status === 'rejected' ? 'Avvist' :
                                                        expense.status === 'approved' ? 'Godkjent' : 'Til behandling'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AdminExpenseActions expense={expense} />
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
