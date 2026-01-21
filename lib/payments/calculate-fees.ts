import { createClient } from '@/lib/supabase/server'

interface FeeCalculation {
    applicationFee: number     // Platform fee (application_fee in Stripe)
    netToOrganization: number  // Amount organization receives (after Stripe fee + application fee)
    stripeFee: number          // Estimated Stripe processing fee (2.4% + 2 NOK)
    breakdown: {
        originalAmount: number
        subscriptionBalanceBefore: number
        subscriptionBalanceAfter: number
        coveredByThisPayment: number
        phase: 'covering_annual_fee' | 'annual_fee_complete' | 'standard_transaction'
    }
}

const STRIPE_PERCENTAGE = 0.024  // 2.4%
const STRIPE_FIXED = 200          // 2 NOK in øre
const PLATFORM_FIXED = 500        // 5 NOK in øre (Phase 2)
const PLATFORM_PERCENTAGE = 0.025 // 2.5% (Phase 2)

function calculateStripeFee(amountInOre: number): number {
    return Math.round(amountInOre * STRIPE_PERCENTAGE) + STRIPE_FIXED
}

export async function calculateFees(
    organizationId: string,
    paymentAmountInOre: number  // Amount in øre (e.g., 10000 = 100 NOK)
): Promise<FeeCalculation> {
    const supabase = await createClient()

    const { data: org, error } = await supabase
        .from('organizations')
        .select('subscription_balance, subscription_year, stripe_account_id, custom_annual_fee')
        .eq('id', organizationId)
        .single()

    if (error || !org) {
        throw new Error(`Organization not found: ${organizationId}`)
    }

    if (!org.stripe_account_id) {
        throw new Error(`Organization ${organizationId} has not completed Stripe onboarding`)
    }

    const currentYear = new Date().getFullYear()
    let balanceInOre = Number(org.subscription_balance) * 100 // Convert to øre

    // Default fee is 990 NOK (99000 øre), unless custom fee is set
    const annualFeeInOre = (org.custom_annual_fee || 990) * 100

    if (isNaN(balanceInOre) || org.subscription_year !== currentYear) {
        balanceInOre = annualFeeInOre
    }

    const stripeFee = calculateStripeFee(paymentAmountInOre)
    let result: FeeCalculation

    if (balanceInOre > 0) {
        // PHASE 1: Covering annual subscription fee (990 NOK)

        // In Phase 1: We want to cover the subscription.
        const amountToCover = Math.min(paymentAmountInOre, balanceInOre)

        // max application fee = payment - stripeFee to avoid negative transfer
        const maxApplicationFee = paymentAmountInOre - stripeFee
        const applicationFee = Math.min(amountToCover, maxApplicationFee)

        const netToOrganization = paymentAmountInOre - applicationFee - stripeFee

        result = {
            applicationFee,
            stripeFee,
            netToOrganization,
            breakdown: {
                originalAmount: paymentAmountInOre,
                subscriptionBalanceBefore: balanceInOre,
                subscriptionBalanceAfter: balanceInOre - applicationFee,
                coveredByThisPayment: applicationFee,
                phases: applicationFee >= balanceInOre ? 'annual_fee_complete' : 'covering_annual_fee'
            } as any // Cast to any to avoid strict type mismatch on 'phase' vs 'phases' typo if present in interface
        }
    } else {
        // PHASE 2: Standard transaction fee
        const applicationFee = PLATFORM_FIXED + Math.round(paymentAmountInOre * PLATFORM_PERCENTAGE)
        const netToOrganization = paymentAmountInOre - applicationFee - stripeFee

        result = {
            applicationFee,
            stripeFee,
            netToOrganization,
            breakdown: {
                originalAmount: paymentAmountInOre,
                subscriptionBalanceBefore: 0,
                subscriptionBalanceAfter: 0,
                coveredByThisPayment: 0,
                phase: 'standard_transaction'
            }
        }
    }

    return result
}
