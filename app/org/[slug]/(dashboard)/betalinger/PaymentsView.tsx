'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { CreditCard } from 'lucide-react'

interface Payment {
    id: string
    amount: number
    type: string
    description: string
    created_at: string
    subscription_deduction: number
    service_fee: number
    payout_to_org: number
    event_id?: string
    member?: {
        first_name: string
        last_name: string
        email: string
    } | null
}

export default function PaymentsView({
    payments,
    orgSlug,
    balance
}: {
    payments: Payment[],
    orgSlug: string,
    balance: number
}) {
    const [filter, setFilter] = useState<'all' | 'membership' | 'event'>('all')

    const filteredPayments = payments.filter(p => {
        if (filter === 'all') return true
        if (filter === 'membership') return p.type === 'membership_fee'
        if (filter === 'event') return p.type === 'event_registration'
        return true
    })

    const totalPayout = filteredPayments.reduce((sum, p) => sum + (Number(p.payout_to_org) || 0), 0)
    const totalSubscription = filteredPayments.reduce((sum, p) => sum + (Number(p.subscription_deduction) || 0), 0)
    const totalFees = filteredPayments.reduce((sum, p) => sum + (Number(p.service_fee) || 0), 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Betalingsoversikt</h1>
                    <p className="text-muted-foreground">
                        Alle betalinger for inneværende år
                    </p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Alle
                    </button>
                    <button
                        onClick={() => setFilter('membership')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'membership' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Kontingent
                    </button>
                    <button
                        onClick={() => setFilter('event')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'event' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Arrangementer
                    </button>
                </div>
            </div>

            {/* Sammendrag */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Til årsabonnement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalSubscription.toFixed(2)} kr</p>
                        {balance > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {balance} kr gjenstår
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Gebyrer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalFees.toFixed(2)} kr</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Utbetalt til dere
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">{totalPayout.toFixed(2)} kr</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabell */}
            {filteredPayments.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="Ingen betalinger funnet"
                    description="Det er ingen betalinger som matcher filteret ditt."
                />
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Medlem</TableHead>
                                <TableHead>Beskrivelse</TableHead>
                                <TableHead>Beløp</TableHead>
                                <TableHead>Til abonnement</TableHead>
                                <TableHead>Gebyr</TableHead>
                                <TableHead className="text-right">Til dere</TableHead>
                                <TableHead>Dato</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((payment, index) => {
                                const subDed = Number(payment.subscription_deduction) || 0
                                const fee = Number(payment.service_fee) || 0
                                const payout = Number(payment.payout_to_org) || 0
                                const memberName = payment.member ? `${payment.member.first_name || ''} ${payment.member.last_name || ''}`.trim() : 'Ukjent'

                                return (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">
                                            #{filteredPayments.length - index}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{memberName || payment.member?.email}</span>
                                                {memberName && <span className="text-xs text-muted-foreground">{payment.member?.email}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {payment.event_id ? (
                                                <Link
                                                    href={`/org/${orgSlug}/arrangementer/${payment.event_id}`}
                                                    className="text-blue-600 hover:underline font-medium"
                                                >
                                                    {payment.description || 'Arrangement'}
                                                </Link>
                                            ) : (
                                                <span className="text-gray-700">
                                                    {payment.description || (payment.type === 'membership_fee' ? 'Medlemskontingent' : 'Annet')}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{Number(payment.amount).toFixed(2)} kr</TableCell>
                                        <TableCell>
                                            {subDed > 0 ? (
                                                <Badge variant="secondary">
                                                    {subDed.toFixed(2)} kr
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {fee > 0 ? (
                                                <span className="text-muted-foreground">
                                                    {fee.toFixed(2)} kr
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {payout.toFixed(2)} kr
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(payment.created_at).toLocaleDateString('nb-NO')}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6} className="font-medium">
                                    TOTALT UTBETALT ({filter === 'all' ? 'Alle' : filter === 'membership' ? 'Kontingent' : 'Arrangement'})
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg">
                                    {totalPayout.toFixed(2)} kr
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </Card>
            )}
        </div>
    )
}
