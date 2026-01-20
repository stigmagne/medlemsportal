import { createClient } from '@/lib/supabase/server'

interface FeeCalculation {
    platformFee: number        // Beløp til årsavgift
    transactionFee: number     // 15 kr gebyr (eller 0)
    netToOrganization: number  // Til foreningen
    breakdown: {
        originalAmount: number
        subscriptionBalanceBefore: number
        subscriptionBalanceAfter: number
        coveredByThisPayment: number
        phase: 'covering_annual_fee' | 'annual_fee_complete' | 'standard_transaction'
    }
}

export async function calculateFees(
    organizationId: string,
    paymentAmount: number
): Promise<FeeCalculation> {
    const supabase = await createClient()

    // Steg 1: Hent org fra database
    const { data: org, error } = await supabase
        .from('organizations')
        .select('subscription_balance, subscription_year, subscription_plan')
        .eq('id', organizationId)
        .single()

    if (error || !org) {
        throw new Error(`Fant ikke organisasjon ${organizationId}: ${error?.message}`)
    }

    const currentYear = new Date().getFullYear()
    let balance = Number(org.subscription_balance)

    const TRANSACTION_FEE = 15

    // Safety check for NaN
    if (isNaN(balance)) balance = 990

    let result: FeeCalculation

    if (balance > 0) {
        // FASE 1: Dekke årsavgift (subscription debt)
        // Vi tar hele beløpet opp til gjenstående balanse
        const platformFee = Math.min(paymentAmount, balance)
        const netToOrganization = paymentAmount - platformFee
        const transactionFee = 0  // Vipps-gebyr dekkes av oss (inkludert i platformFee) eller 0? 
        // Gammel logikk: "INGEN transaksjonsgebyr mens årsavgift dekkes"

        result = {
            platformFee,
            transactionFee,
            netToOrganization,
            breakdown: {
                originalAmount: paymentAmount,
                subscriptionBalanceBefore: balance,
                subscriptionBalanceAfter: balance - platformFee,
                coveredByThisPayment: platformFee,
                phase: platformFee >= balance
                    ? 'annual_fee_complete' // Denne betalingen fullførte gjelden
                    : 'covering_annual_fee'
            }
        }
    } else {
        // FASE 2: Årsavgift er nedbetalt (0 i balanse) -> Standard transaksjonsgebyr
        const transactionFee = Math.min(paymentAmount, TRANSACTION_FEE)
        const platformFee = 0
        const netToOrganization = paymentAmount - transactionFee

        result = {
            platformFee,
            transactionFee,
            netToOrganization,
            breakdown: {
                originalAmount: paymentAmount,
                subscriptionBalanceBefore: 0,
                subscriptionBalanceAfter: 0,
                coveredByThisPayment: 0,
                phase: 'standard_transaction'
            }
        }
    }

    // Steg 4: Oppdater database hvis balansen endres eller året må oppdateres
    if (result.platformFee > 0 || org.subscription_year !== currentYear) {
        await supabase
            .from('organizations')
            .update({
                subscription_balance: result.breakdown.subscriptionBalanceAfter,
                subscription_year: currentYear
            })
            .eq('id', organizationId)
    }

    return result
}
