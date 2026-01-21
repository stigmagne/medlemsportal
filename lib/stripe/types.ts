export interface StripePaymentIntentMetadata {
    organization_id: string
    member_id?: string
    payment_type: 'membership' | 'event'
    event_id?: string
    description: string
}

export interface StripeOnboardingResult {
    accountId: string
    onboardingUrl: string
}

export interface StripeAccountStatus {
    accountId: string
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
    requiresAction: boolean
}
