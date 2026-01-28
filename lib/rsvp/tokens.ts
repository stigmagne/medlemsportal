import crypto from 'crypto'

/**
 * Generates a signed RSVP token for a meeting invite
 */
export function generateRsvpToken(meetingId: string, memberId: string, expiresAt: number): string {
    const secret = process.env.RSVP_TOKEN_SECRET
    if (!secret) throw new Error('RSVP_TOKEN_SECRET is not set')

    const payload = `${meetingId}:${memberId}:${expiresAt}`
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

    return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

/**
 * Verifies a signed RSVP token
 */
export function verifyRsvpToken(token: string): {
    valid: boolean;
    data?: { meetingId: string; memberId: string; expiresAt: number };
    error?: string
} {
    try {
        const secret = process.env.RSVP_TOKEN_SECRET
        if (!secret) throw new Error('RSVP_TOKEN_SECRET is not set')

        const decoded = Buffer.from(token, 'base64url').toString('utf-8')
        const parts = decoded.split(':')

        // Expect: meetingId:memberId:expiresAt:signature
        if (parts.length !== 4) return { valid: false, error: 'Invalid token format' }

        const [meetingId, memberId, expiresAtStr, signature] = parts
        const expiresAt = parseInt(expiresAtStr)

        // 1. Verify signature
        const payload = `${meetingId}:${memberId}:${expiresAt}`
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex')

        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid signature' }
        }

        // 2. Check expiry
        if (expiresAt < Date.now()) {
            return { valid: false, error: 'Token expired' }
        }

        return {
            valid: true,
            data: { meetingId, memberId, expiresAt }
        }
    } catch (e) {
        return { valid: false, error: 'Token malformed' }
    }
}
