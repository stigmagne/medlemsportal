'use server'

import { createClient } from '@/lib/supabase/server'
import { initiatePayment } from '@/lib/vipps/client'
import { VippsPaymentRequest } from '@/lib/vipps/types'
import { redirect } from 'next/navigation'

export async function initiateMembershipPayment(org_id: string, fee_id: string, member_id: string) {
    const supabase = await createClient()

    // 1. Fetch Fee Details
    const { data: fee } = await supabase
        .from('membership_fees')
        .select('*')
        .eq('id', fee_id)
        .eq('organization_id', org_id)
        .single()

    if (!fee) return { error: 'Kontingent ikke funnet' }

    // 2. Fetch Member Details (for phone number)
    const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', member_id)
        .single()

    if (!member) return { error: 'Medlem ikke funnet' }

    // 3. Create Internal Transaction Record
    const { data: transaction, error: txError } = await supabase
        .from('payment_transactions')
        .insert({
            organization_id: org_id,
            member_id: member.id,
            fee_id: fee.id,
            amount: fee.amount,
            status: 'initiated',
            // vipps_order_id will be set after we generate it or get from Vipps
        })
        .select()
        .single()

    if (txError || !transaction) {
        console.error('DB Error:', txError)
        return { error: 'Kunne ikke opprette transaksjon' }
    }

    // 4. Prepare Vipps Request
    const orderId = `order_${transaction.id.replace(/-/g, '').substring(0, 15)}_${Date.now().toString().substring(10)}` // Max 30 chars usually safe

    // Ensure amount is in ore/cents (Integer)
    const amountInCents = Math.round(fee.amount * 100)

    // Sanitize phone (remove spaces, +47)
    let phone = member.phone?.replace(/\s+/g, '').replace('+', '') || ''
    // If no phone, Vipps might ask user to input it on landing page? 
    // Actually Vipps requires phoneNumber in some flows or it defaults to landing selection. 
    // For "WALLET" flow, phone is good to have.
    // Spec: customer.phoneNumber is required for "PUSH_MESSAGE", optional for "WEB_REDIRECT"? Let's verify.
    // Docs say: "phoneNumber is optional. If not provided, the user will be asked to enter it on the landing page."

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/org/${org_id}/min-side?payment_status=success` // Simplified helper return

    const vippsRequest: VippsPaymentRequest = {
        amount: {
            value: amountInCents,
            currency: 'NOK',
        },
        paymentMethod: {
            type: 'WALLET',
        },
        customer: {
            phoneNumber: phone, // Can be empty if we want user to input
        },
        reference: orderId,
        userFlow: 'WEB_REDIRECT',
        returnUrl: returnUrl,
        paymentDescription: `Betaling for ${fee.name}`,
    }

    try {
        // 5. Call Vipps API
        const response = await initiatePayment(vippsRequest)

        // 6. Update Transaction with Order ID and Reference
        await supabase
            .from('payment_transactions')
            .update({
                vipps_order_id: orderId,
                status: 'pending' // Pending user action
            })
            .eq('id', transaction.id)

        // 7. Return Redirect URL
        return { url: response.redirectUrl }

    } catch (e: any) {
        console.error('Vipps Error:', e.message)
        return { error: 'Feil ved kommunikasjon med Vipps: ' + e.message }
    }
}
