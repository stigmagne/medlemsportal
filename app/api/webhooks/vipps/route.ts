import { recordPayment } from '@/app/actions/payments'

export async function POST(request: Request) {
    try {
        const payload = await request.json()

        // Note: In production you MUST validate the Vipps signature here
        // using the 'X-Request-Signature' header and your secret.

        if (payload.event === 'payment.completed') {
            const {
                org_id,
                member_id,
                payment_type
            } = payload.metadata || {}

            if (org_id && member_id) {
                await recordPayment({
                    orgId: org_id,
                    memberId: member_id,
                    amount: payload.amount / 100, // Vipps amount is in øre
                    vippsTransactionId: payload.transaction_id,
                    paymentType: payment_type || 'membership'
                })
            }
        }

        return new Response('OK', { status: 200 })
    } catch (error) {
        console.error('Vipps webhook error:', error)
        return new Response('Error', { status: 500 })
    }
}
