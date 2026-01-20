import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VippsCallback } from '@/lib/vipps/types'
import { capturePayment } from '@/lib/vipps/client'

// This secret must match what you configured in Vipps Portal
const CALLBACK_SECRET = process.env.VIPPS_CALLBACK_SECRET

export async function POST(req: NextRequest) {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization')
    if (CALLBACK_SECRET && authHeader !== `Bearer ${CALLBACK_SECRET}`) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    try {
        const body: VippsCallback = await req.json()
        const { reference, state, amount, success } = body

        console.log(`Vipps Callback for ${reference}: ${state} (Success: ${success})`)

        const supabase = await createClient()

        // 2. Update Transaction Status in DB
        // We look up by `vipps_order_id` which we stored as `reference`
        const { data: transaction, error } = await supabase
            .from('payment_transactions')
            .select('id, status, amount, organization_id, member_id')
            .eq('vipps_order_id', reference)
            .single()

        if (error || !transaction) {
            console.error('Transaction not found or error:', error)
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 })
        }

        // Map Vipps State to Internal Status
        let internalStatus = transaction.status
        let shouldCapture = false

        if (state === 'AUTHORIZED') {
            internalStatus = 'authorized'
            shouldCapture = true // For memberships, we usually want to capture immediately upon authorization
        } else if (state === 'CAPTURED') {
            internalStatus = 'paid'
        } else if (state === 'TERMINATED' || state === 'VOID') {
            internalStatus = 'cancelled'
        } else if (state === 'REFUNDED') {
            internalStatus = 'refunded'
        }

        // Update DB
        const { calculateFees } = await import('@/lib/payments/calculate-fees')
        let feeResult = null

        if (internalStatus === 'paid' || internalStatus === 'authorized') {
            try {
                // Determine organization ID. 
                // Transaction has organization_id.
                feeResult = await calculateFees(transaction.organization_id, transaction.amount)
            } catch (feeError) {
                console.error('Fee calculation failed:', feeError)
                // Continue without failing the webhook, but maybe log it critically
            }
        }

        await supabase
            .from('payment_transactions')
            .update({
                status: internalStatus,
                updated_at: new Date().toISOString(),
                ...(feeResult ? {
                    platform_fee: feeResult.platformFee,
                    transaction_fee: feeResult.transactionFee,
                    net_to_organization: feeResult.netToOrganization,
                    fee_breakdown: feeResult.breakdown
                } : {})
            })
            .eq('id', transaction.id)

        // 3. Auto-Capture Logic (Optional but recommended for memberships)
        if (shouldCapture) {
            try {
                // We capture the full amount
                await capturePayment(reference, amount.value, amount.currency)
                // If capture is successful, Vipps will send another callback with state=CAPTURED
                // But we can also proactively update status to 'paid' or 'captured' if we trust the API call
                console.log(`Auto-captured payment for ${reference}`)
            } catch (capError) {
                console.error('Auto-capture failed:', capError)
                // Do not fail the webhook response, just log it. Admin might need to manually capture.
            }
        }

        // 4. Update Contingnent Payment Status if linked (optional, if we keep the other table sync)
        if (internalStatus === 'paid') {
            // Logic to mark membership as active or paid until date
            // This depends on how we model membership validity.
            // For now, we mainly rely on payment_transactions log.
        }

        return NextResponse.json({ message: 'OK' })
    } catch (e) {
        console.error('Webhook processing failed:', e)
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 })
    }
}
