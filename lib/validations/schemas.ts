import { z } from 'zod'

// =====================================================
// Payment Validation
// =====================================================

export const paymentAmountSchema = z.object({
    amount: z.number()
        .positive('Beløpet må være større enn 0')
        .finite('Beløpet må være et gyldig tall')
        .refine((val) => val < 1000000, {
            message: 'Beløpet kan ikke overstige 1 000 000 kr'
        }),
    description: z.string()
        .min(1, 'Beskrivelse er påkrevd')
        .max(500, 'Beskrivelse kan ikke overstige 500 tegn')
        .trim(),
    accountNumber: z.string()
        .regex(/^\d{11}$/, 'Kontonummer må være 11 siffer')
        .optional()
})

export const recordPaymentSchema = z.object({
    memberId: z.string().uuid('Ugyldig medlem-ID'),
    amount: z.number()
        .positive('Beløpet må være større enn 0')
        .finite('Beløpet må være et gyldig tall'),
    description: z.string()
        .min(1, 'Beskrivelse er påkrevd')
        .max(500, 'Beskrivelse kan ikke overstige 500 tegn')
        .trim(),
    paymentMethod: z.enum(['card', 'invoice', 'cash', 'bank_transfer'], {
        errorMap: () => ({ message: 'Ugyldig betalingsmåte' })
    }),
    date: z.string().datetime('Ugyldig dato format')
})

// =====================================================
// Date Validation
// =====================================================

export const futureDateSchema = z.object({
    date: z.string()
        .datetime('Ugyldig dato format')
        .refine((dateStr) => {
            const date = new Date(dateStr)
            const now = new Date()
            return date > now
        }, {
            message: 'Datoen må være i fremtiden'
        })
})

export const pastDateSchema = z.object({
    date: z.string()
        .datetime('Ugyldig dato format')
        .refine((dateStr) => {
            const date = new Date(dateStr)
            const now = new Date()
            return date <= now
        }, {
            message: 'Datoen kan ikke være i fremtiden'
        })
})

export const dateRangeSchema = z.object({
    startDate: z.string().datetime('Ugyldig startdato format'),
    endDate: z.string().datetime('Ugyldig sluttdato format')
}).refine((data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end > start
}, {
    message: 'Sluttdato må være etter startdato',
    path: ['endDate']
})

// =====================================================
// Meeting Minutes Validation (XSS Prevention)
// =====================================================

// List of allowed HTML tags (very restrictive)
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3']

export const meetingMinutesSchema = z.object({
    content: z.string()
        .min(1, 'Innhold er påkrevd')
        .max(50000, 'Innholdet kan ikke overstige 50 000 tegn')
        .refine((content) => {
            // Basic XSS prevention: reject any script tags or event handlers
            const dangerousPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i, // onclick, onerror, etc.
                /<iframe/i,
                /<object/i,
                /<embed/i,
                /<link/i,
                /<meta/i
            ]

            return !dangerousPatterns.some(pattern => pattern.test(content))
        }, {
            message: 'Innholdet inneholder potensielt farlige elementer'
        })
        .refine((content) => {
            // Ensure only allowed HTML tags are used
            const tagRegex = /<(\w+)[^>]*>/g
            const matches = content.matchAll(tagRegex)

            for (const match of matches) {
                const tag = match[1].toLowerCase()
                if (!ALLOWED_TAGS.includes(tag)) {
                    return false
                }
            }

            return true
        }, {
            message: `Kun følgende HTML-tagger er tillatt: ${ALLOWED_TAGS.join(', ')}`
        }),
    meetingId: z.string().uuid('Ugyldig møte-ID'),
    title: z.string()
        .min(1, 'Tittel er påkrevd')
        .max(200, 'Tittel kan ikke overstige 200 tegn')
        .trim()
})

// =====================================================
// Onboarding Data Validation
// =====================================================

// Define the structure of onboarding data
export const onboardingStepSchema = z.object({
    step: z.string().min(1),
    completed: z.boolean(),
    completedAt: z.string().datetime().optional()
})

export const onboardingDataSchema = z.object({
    data: z.record(z.unknown())
        .refine((data) => {
            // Ensure the data object has expected structure
            if (typeof data !== 'object' || data === null) {
                return false
            }

            // Validate each value is either a primitive or an array of primitives
            for (const value of Object.values(data)) {
                if (value === null || value === undefined) continue

                const type = typeof value
                if (type !== 'string' && type !== 'number' && type !== 'boolean' && !Array.isArray(value)) {
                    return false
                }

                if (Array.isArray(value)) {
                    for (const item of value) {
                        const itemType = typeof item
                        if (itemType !== 'string' && itemType !== 'number' && itemType !== 'boolean') {
                            return false
                        }
                    }
                }
            }

            return true
        }, {
            message: 'Onboarding data må være et objekt med primitive verdier'
        })
        .refine((data) => {
            // Limit the size of the data object
            const jsonStr = JSON.stringify(data)
            return jsonStr.length < 10000 // Max 10KB
        }, {
            message: 'Onboarding data er for stort (maks 10KB)'
        })
})

// =====================================================
// Travel Expenses Validation
// =====================================================

export const travelExpenseSchema = z.object({
    description: z.string()
        .min(1, 'Beskrivelse er påkrevd')
        .max(500, 'Beskrivelse kan ikke overstige 500 tegn')
        .trim(),
    travelDate: z.string()
        .datetime('Ugyldig dato format')
        .refine((dateStr) => {
            const date = new Date(dateStr)
            const now = new Date()
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(now.getFullYear() - 1)

            return date >= oneYearAgo && date <= now
        }, {
            message: 'Reisedato må være innen siste år og ikke i fremtiden'
        }),
    transportType: z.enum(['car', 'public', 'flight', 'other']),
    distanceKm: z.number()
        .nonnegative('Avstand kan ikke være negativ')
        .max(5000, 'Avstand kan ikke overstige 5000 km')
        .optional(),
    tollParkingCost: z.number()
        .nonnegative('Beløp kan ikke være negativt')
        .max(10000, 'Beløp kan ikke overstige 10 000 kr')
        .optional(),
    ticketCost: z.number()
        .nonnegative('Beløp kan ikke være negativt')
        .max(50000, 'Beløp kan ikke overstige 50 000 kr')
        .optional(),
    bankAccount: z.string()
        .regex(/^\d{11}$/, 'Kontonummer må være 11 siffer')
})

// =====================================================
// Helper Functions
// =====================================================

/**
 * Sanitize HTML content by removing dangerous elements
 * This is a basic implementation - for production, consider using DOMPurify
 */
export function sanitizeHTML(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
}

/**
 * Validate and parse a schema, returning errors in a user-friendly format
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
    const result = schema.safeParse(data)

    if (!result.success) {
        const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }))

        return {
            success: false as const,
            errors,
            validatedData: null
        }
    }

    return {
        success: true as const,
        errors: [],
        validatedData: result.data
    }
}
