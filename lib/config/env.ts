/**
 * Environment variable validation utility
 * Ensures required API keys are present in production
 */

/**
 * Require an environment variable to be set.
 * In production, throws an error if the variable is missing.
 * In development, returns a placeholder value with a warning.
 */
export function requireEnvVar(name: string, defaultValue?: string): string {
    const value = process.env[name]

    if (!value) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                `Missing required environment variable: ${name}. ` +
                `This is a critical error in production. Please set ${name} in your environment.`
            )
        }

        // In development, warn but allow fallback
        console.warn(
            `⚠️  Missing environment variable: ${name}. ` +
            `Using ${defaultValue ? 'fallback value' : 'empty string'} for development.`
        )

        return defaultValue || ''
    }

    return value
}

/**
 * Check if all required environment variables are set
 * Call this during application startup for early failure detection
 */
export function validateRequiredEnvVars() {
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'RESEND_API_KEY',
        'NEXT_PUBLIC_BASE_URL'
    ]

    const missing: string[] = []

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missing.push(varName)
        }
    }

    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}. ` +
            `Application cannot start in production without these variables.`
        )
    }

    if (missing.length > 0) {
        console.warn(
            `⚠️  Missing optional environment variables: ${missing.join(', ')}. ` +
            `Some features may not work correctly.`
        )
    }
}
