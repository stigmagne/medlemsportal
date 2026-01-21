"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function RevenueCalculator() {
    const [memberCount, setMemberCount] = useState<number>(30)
    const [annualFee, setAnnualFee] = useState<number>(200)
    const [platformFeeYearly, setPlatformFeeYearly] = useState<number>(990)

    // Pricing Model Constants
    // const PLATFORM_FEE_YEARLY = 990
    const TX_FEE_FIXED = 5
    const TX_FEE_PERCENT = 0.025 // 2.5%
    const STRIPE_COST_FIXED = 2 // Estimated cost for us
    const STRIPE_COST_PERCENT = 0.024 // Estimated cost for us

    // Calculations
    const grossRevenue = memberCount * annualFee

    // Calculate Platform Revenue vs Association Payout
    let platformFeeCollected = 0
    let transactionFeesCollected = 0
    let payoutToAssociation = 0
    let stripeCost = 0

    // Simulation per transaction
    // Assuming 1 payment per member per year for simplicity
    for (let i = 0; i < memberCount; i++) {
        const txAmount = annualFee

        // Check if we still need to cover platform fee
        const neededForPlatform = platformFeeYearly - platformFeeCollected

        if (neededForPlatform > 0) {
            // "No Cure No Pay" Phase:
            // We take up to the needed amount. 
            // The association gets the rest.
            // NO transaction fee is charged to the association in this phase (we absorb the cost).
            const takeForPlatform = Math.min(txAmount, neededForPlatform)
            platformFeeCollected += takeForPlatform

            const remainderForAssoc = txAmount - takeForPlatform
            payoutToAssociation += remainderForAssoc
        } else {
            // Normal Phase:
            // Platform fee is covered. usage fees apply.
            const txFee = TX_FEE_FIXED + (txAmount * TX_FEE_PERCENT)
            transactionFeesCollected += txFee

            const remainderForAssoc = txAmount - txFee
            payoutToAssociation += remainderForAssoc
        }

        // Our Cost (Stripe) always applies to every transaction
        stripeCost += STRIPE_COST_FIXED + (txAmount * STRIPE_COST_PERCENT)
    }

    const ourTotalRevenue = platformFeeCollected + transactionFeesCollected
    const ourNetMargin = ourTotalRevenue - stripeCost
    const associationSharePercent = (payoutToAssociation / grossRevenue) * 100

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Inndata</CardTitle>
                    <CardDescription>Simuler inntekter for en forening.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="members">Antall medlemmer</Label>
                        <Input
                            id="members"
                            type="number"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={memberCount}
                            onChange={(e) => setMemberCount(parseInt(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fee">Årskontingent (kr)</Label>
                        <Input
                            id="fee"
                            type="number"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={annualFee}
                            onChange={(e) => setAnnualFee(parseInt(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>

                    <Separator />

                    <div className="pt-4">
                        <h3 className="font-semibold mb-2">Prisingsmodell</h3>
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            <li>Startkostnad: 0,-</li>
                            <li>Plattformavgift: {platformFeeYearly},- (trekkes fra innbetalinger)</li>
                            <li>Transaksjonsgebyr: {TX_FEE_FIXED} kr + {(TX_FEE_PERCENT * 100).toFixed(1)}%</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle>Resultat for Foreningen</CardTitle>
                    <CardDescription>Hva sitter de igjen med?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Brutto innbetalt:</span>
                        <span className="font-medium">{grossRevenue.toLocaleString('nb-NO')} kr</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-amber-600">
                        <span>- Plattformavgift (dekkes av første betalinger):</span>
                        <span>{platformFeeCollected.toLocaleString('nb-NO')} kr</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>- Transaksjonsgebyrer:</span>
                        <span>{transactionFeesCollected.toLocaleString('nb-NO')} kr</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Utbetalt til forening:</span>
                        <span className="text-emerald-600">{payoutToAssociation.toLocaleString('nb-NO')} kr</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                        (Tilsvarer ca {associationSharePercent.toFixed(1)}% av totalen)
                    </p>
                </CardContent>
            </Card>

            {/* Superadmin Internal Section */}
            <Card className="md:col-span-2 border-dashed border-slate-300">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-slate-500">INTERNAL: PLATFORM METRICS</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Our Gross Revenue (Fee + Tx)</TableCell>
                                <TableCell className="text-right">{ourTotalRevenue.toLocaleString('nb-NO')} kr</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Est. Stripe Cost (Cost of Goods Sold)</TableCell>
                                <TableCell className="text-right text-red-500">-{stripeCost.toLocaleString('nb-NO')} kr</TableCell>
                            </TableRow>
                            <TableRow className="font-bold">
                                <TableCell>Net Profit</TableCell>
                                <TableCell className="text-right text-green-600">{ourNetMargin.toLocaleString('nb-NO')} kr</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
