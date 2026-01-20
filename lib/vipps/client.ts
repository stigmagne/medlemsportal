import { VippsAccessTokenResponse, VippsPaymentRequest, VippsPaymentResponse } from './types'

const VIPPS_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.vipps.no'
    : 'https://apitest.vipps.no'

const CLIENT_ID = process.env.VIPPS_CLIENT_ID!
const CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET!
const SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY!
const MERCHANT_SERIAL = process.env.VIPPS_MERCHANT_SERIAL_NUMBER!

// Simple in-memory cache for token
let tokenCache: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
    const now = Date.now()
    if (tokenCache && tokenCache.expiresAt > now + 60000) { // Buffer 1 min
        return tokenCache.token
    }

    if (!CLIENT_ID || !CLIENT_SECRET || !SUBSCRIPTION_KEY) {
        throw new Error('Missing Vipps Configuration (CLIENT_ID, SECRET or SUB_KEY)')
    }

    const response = await fetch(`${VIPPS_BASE_URL}/accesstoken/get`, {
        method: 'POST',
        headers: {
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Merchant-Serial-Number': MERCHANT_SERIAL,
        },
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch access token: ${response.status} ${errorText}`)
    }

    const data: VippsAccessTokenResponse = await response.json()
    const expiresMs = parseInt(data.expires_in) * 1000

    tokenCache = {
        token: data.access_token,
        expiresAt: now + expiresMs,
    }

    return data.access_token
}

export async function initiatePayment(request: VippsPaymentRequest): Promise<VippsPaymentResponse> {
    const token = await getAccessToken()

    const response = await fetch(`${VIPPS_BASE_URL}/epayment/v1/payments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Merchant-Serial-Number': MERCHANT_SERIAL,
            'Content-Type': 'application/json',
            'Idempotency-Key': request.reference, // Use reference as idempotent key
        },
        body: JSON.stringify(request),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Vipps Init Error', errorText)
        throw new Error(`Failed to initiate payment: ${response.statusText}`)
    }

    return await response.json()
}

export async function getPaymentDetails(reference: string) {
    const token = await getAccessToken()

    const response = await fetch(`${VIPPS_BASE_URL}/epayment/v1/payments/${reference}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Merchant-Serial-Number': MERCHANT_SERIAL,
        }
    })

    if (!response.ok) throw new Error('Failed to get payment details')
    return await response.json()
}

export async function capturePayment(reference: string, amountValue: number, currency: string = 'NOK') {
    const token = await getAccessToken()

    const response = await fetch(`${VIPPS_BASE_URL}/epayment/v1/payments/${reference}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Merchant-Serial-Number': MERCHANT_SERIAL,
            'Content-Type': 'application/json',
            'Idempotency-Key': `${reference}-capture` // Simple idempotency for full capture
        },
        body: JSON.stringify({
            modificationAmount: {
                value: amountValue,
                currency: currency
            }
        })
    })

    if (!response.ok) {
        const txt = await response.text()
        throw new Error(`Capture failed: ${txt}`)
    }
    return await response.json()
}

export async function cancelPayment(reference: string) {
    const token = await getAccessToken()

    const response = await fetch(`${VIPPS_BASE_URL}/epayment/v1/payments/${reference}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Merchant-Serial-Number': MERCHANT_SERIAL,
            'Content-Type': 'application/json',
            'Idempotency-Key': `${reference}-cancel`
        }
    })

    if (!response.ok) throw new Error('Cancel failed')
    return await response.json()
}
