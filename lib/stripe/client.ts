import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    // In CI or build time, this might be missing. 
    // We can throw or warn. For strictness, let's warn and return a dummy if causing issues, 
    // but usually for server-side operations we want to fail fast if missing.
    // However, to prevent build crashes if this file is imported statically:
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) { // Simple check? 
        // safer to just rely on env.
    }
}

// Fallback to avoid build crashes, but will fail at runtime if used without key
const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover', // Latest stable API version as of early 2025 (or check provided context)
    typescript: true,
})
