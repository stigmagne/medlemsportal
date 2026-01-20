export type VippsCurrency = 'NOK' | 'EUR' | 'DKK'

export type VippsPaymentRequest = {
    amount: {
        value: number // Integer (ore/cents), e.g. 1000 = 10.00 NOK
        currency: VippsCurrency
    }
    paymentMethod: {
        type: 'WALLET' | 'CARD'
    }
    customer: {
        phoneNumber: string
    }
    reference: string // Unique order ID
    userFlow: 'WEB_REDIRECT' | 'PUSH_MESSAGE' | 'QR'
    returnUrl: string
    paymentDescription: string
    profile?: {
        scope: string // e.g. 'name address email'
    }
}

export type VippsPaymentResponse = {
    reference: string
    redirectUrl: string
}

export type VippsAccessTokenResponse = {
    access_token: string
    expires_in: string // Int as string? Or int? Specs say string or int depending on version. Usually int in JSON.
    token_type: string
    scope: string
}

// Webhook payload type
export type VippsCallback = {
    reference: string
    amount: {
        value: number
        currency: VippsCurrency
    }
    state: 'AUTHORIZED' | 'TERMINATED' | 'VOID' | 'CAPTURED' | 'REFUNDED'
    success: boolean
    transaction: {
        transactionId: string
        timeStamp: string
    }
}
