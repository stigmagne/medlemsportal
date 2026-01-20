"use client"

import { RevenueCalculator } from "@/components/superadmin/RevenueCalculator"

export default function CalculatorPage() {
    return (
        <div className="container mx-auto max-w-5xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Inntektskalkulator</h2>
                <p className="text-muted-foreground">
                    Estimer inntekter og fordeling basert på "No Cure, No Pay" modellen.
                </p>
            </div>

            <RevenueCalculator />
        </div>
    )
}
