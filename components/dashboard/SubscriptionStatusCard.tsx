'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Info } from 'lucide-react'

interface SubscriptionStatusCardProps {
    subscriptionBalance: number;
    subscriptionYear: number;
    subscriptionPaidAt?: string;
}

export default function SubscriptionStatusCard({
    subscriptionBalance,
    subscriptionYear,
    subscriptionPaidAt
}: SubscriptionStatusCardProps) {
    const totalSubscription = 990
    const paid = totalSubscription - subscriptionBalance
    const percentPaid = (paid / totalSubscription) * 100
    const isPaid = subscriptionBalance <= 0

    if (isPaid) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Årsabonnement {subscriptionYear}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-700 font-medium">
                        ✓ Fullt dekket
                    </p>
                    {subscriptionPaidAt && (
                        <p className="text-xs text-green-600 mt-1">
                            Betalt: {new Date(subscriptionPaidAt).toLocaleDateString('nb-NO')}
                        </p>
                    )}
                    <p className="text-xs text-green-800/70 mt-3 pt-3 border-t border-green-200/50">
                        Nåværende gebyr for nye betalinger: <span className="font-semibold">5 kr + 2,5%</span>
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Årsabonnement {subscriptionYear}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Fremgang</span>
                        <span className="font-medium">{paid} kr av {totalSubscription} kr</span>
                    </div>
                    <Progress value={percentPaid} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                        Gjenstår: {subscriptionBalance} kr
                    </p>
                </div>

                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs ml-2">
                        De første innbetalingene dekker årsabonnementet automatisk.
                        Når 990 kr er nådd, starter gebyr på 5 kr + 2,5% per betaling.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}
