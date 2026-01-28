/**
 * SECURITY (M1): Centralized Input Validation
 * 
 * This module provides reusable validation functions for common input types
 * to ensure consistent validation across the application.
 */

/**
 * Validate email address format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'E-postadresse er påkrevd' }
    }

    const trimmed = email.trim()

    // RFC 5322 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(trimmed)) {
        return { valid: false, error: 'Ugyldig e-postformat' }
    }

    if (trimmed.length > 254) {
        return { valid: false, error: 'E-postadressen er for lang (maks 254 tegn)' }
    }

    return { valid: true }
}

/**
 * Validate Norwegian phone number
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
    if (!phone || typeof phone !== 'string') {
        return { valid: false, error: 'Telefonnummer er påkrevd' }
    }

    // Remove spaces and common separators
    const normalized = phone.replace(/[\s\-\(\)]/g, '')

    // Norwegian mobile: 8 digits starting with 4 or 9
    // Norwegian landline: 8 digits
    // International: starts with +
    const phoneRegex = /^(\+47)?[0-9]{8}$/

    if (!phoneRegex.test(normalized)) {
        return { valid: false, error: 'Ugyldig norsk telefonnummer (8 siffer)' }
    }

    return { valid: true }
}

/**
 * Validate date is in the future
 */
export function validateFutureDate(dateString: string, fieldName: string = 'Dato'): { valid: boolean; error?: string } {
    if (!dateString || typeof dateString !== 'string') {
        return { valid: false, error: `${fieldName} er påkrevd` }
    }

    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
        return { valid: false, error: `${fieldName} er ugyldig` }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0) // Start of today

    if (date < now) {
        return { valid: false, error: `${fieldName} kan ikke være i fortiden` }
    }

    return { valid: true }
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, error: 'Ugyldig datoformat' }
    }

    if (end <= start) {
        return { valid: false, error: 'Sluttdato må være etter startdato' }
    }

    return { valid: true }
}

/**
 * Validate amount/price (in NOK)
 */
export function validateAmount(
    amount: number | string,
    options: { min?: number; max?: number; allowZero?: boolean } = {}
): { valid: boolean; error?: string } {
    const { min = 1, max = 1000000, allowZero = false } = options

    if (amount === null || amount === undefined) {
        return { valid: false, error: 'Beløp er påkrevd' }
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(numAmount)) {
        return { valid: false, error: 'Beløpet må være et tall' }
    }

    if (!allowZero && numAmount <= 0) {
        return { valid: false, error: 'Beløpet må være større enn 0' }
    }

    if (numAmount < min) {
        return { valid: false, error: `Beløpet må være minst ${min} NOK` }
    }

    if (numAmount > max) {
        return { valid: false, error: `Beløpet kan ikke overstige ${max.toLocaleString('no-NO')} NOK` }
    }

    return { valid: true }
}

/**
 * Validate positive number (for distances, quantities, etc)
 */
export function validatePositiveNumber(
    value: number | string,
    fieldName: string = 'Verdien'
): { valid: boolean; error?: string } {
    if (value === null || value === undefined) {
        return { valid: false, error: `${fieldName} er påkrevd` }
    }

    const num = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(num)) {
        return { valid: false, error: `${fieldName} må være et tall` }
    }

    if (num <= 0) {
        return { valid: false, error: `${fieldName} må være større enn 0` }
    }

    return { valid: true }
}

/**
 * Validate Norwegian bank account number (11 digits with mod11 check)
 */
export function validateBankAccount(account: string): { valid: boolean; error?: string } {
    if (!account || typeof account !== 'string') {
        return { valid: false, error: 'Kontonummer er påkrevd' }
    }

    // Remove spaces
    const normalized = account.replace(/\s/g, '')

    if (!/^\d{11}$/.test(normalized)) {
        return { valid: false, error: 'Kontonummer må være 11 siffer' }
    }

    // Modulus 11 validation
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 10; i++) {
        sum += parseInt(normalized[i]) * weights[i]
    }

    const remainder = sum % 11
    const calculatedCheckDigit = remainder === 0 ? 0 : 11 - remainder
    const actualCheckDigit = parseInt(normalized[10])

    if (calculatedCheckDigit !== actualCheckDigit) {
        return { valid: false, error: 'Ugyldig kontonummer (feil kontrollsiffer)' }
    }

    return { valid: true }
}

/**
 * Validate text length
 */
export function validateTextLength(
    text: string,
    options: { min?: number; max?: number; fieldName?: string }
): { valid: boolean; error?: string } {
    const { min = 0, max = 10000, fieldName = 'Tekst' } = options

    if (!text || typeof text !== 'string') {
        if (min > 0) {
            return { valid: false, error: `${fieldName} er påkrevd` }
        }
        return { valid: true }
    }

    const trimmed = text.trim()

    if (trimmed.length < min) {
        return { valid: false, error: `${fieldName} må være minst ${min} tegn` }
    }

    if (trimmed.length > max) {
        return { valid: false, error: `${fieldName} kan være maks ${max} tegn` }
    }

    return { valid: true }
}

/**
 * Sanitize error messages for safe display to users
 * SECURITY (M2): Prevents leaking database structure and internal details
 */
export function sanitizeError(error: unknown): string {
    // Default safe message
    const defaultMessage = 'En feil oppstod. Kontakt support hvis problemet vedvarer.'

    if (!error) {
        return defaultMessage
    }

    // Log detailed error server-side for debugging
    console.error('Detailed error:', error)

    // If it's an error object
    if (error instanceof Error) {
        const message = error.message.toLowerCase()

        // Common user-friendly error mappings
        if (message.includes('unique constraint') || message.includes('duplicate')) {
            return 'Dette elementet finnes allerede'
        }

        if (message.includes('foreign key') || message.includes('violates')) {
            return 'Ugyldig referanse til relatert data'
        }

        if (message.includes('not found') || message.includes('404')) {
            return 'Fant ikke forespurt ressurs'
        }

        if (message.includes('unauthorized') || message.includes('403')) {
            return 'Du har ikke tilgang til denne handlingen'
        }

        if (message.includes('authentication') || message.includes('401')) {
            return 'Du må være innlogget'
        }

        if (message.includes('validation') || message.includes('invalid')) {
            // If it's our own validation error, show it
            if (!message.includes('table') && !message.includes('column') && !message.includes('sql')) {
                return error.message
            }
        }
    }

    // For string errors
    if (typeof error === 'string') {
        // If it doesn't contain SQL/database keywords, it's probably safe
        const lowerError = error.toLowerCase()
        const dangerousKeywords = ['table', 'column', 'sql', 'query', 'schema', 'constraint', 'pg_', 'postgres']

        const hasDangerousKeywords = dangerousKeywords.some(keyword => lowerError.includes(keyword))

        if (!hasDangerousKeywords) {
            return error
        }
    }

    // Default: don't expose internal details
    return defaultMessage
}
