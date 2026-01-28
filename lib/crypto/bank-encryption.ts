/**
 * Bank Account Encryption Utility
 * 
 * IMPORTANT SECURITY NOTES:
 * 1. Requires APP_ENCRYPTION_KEY environment variable (32-byte hex string)
 * 2. Lost encryption key = PERMANENTLY LOST DATA
 * 3. Key rotation requires re-encrypting all data
 * 4. Not suitable for client-side encryption (key must stay on server)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

/**
 * Get encryption key from environment
 * Throws in production if missing
 */
function getEncryptionKey(): Buffer {
    const keyHex = process.env.APP_ENCRYPTION_KEY

    // SECURITY (M4): No fallback key - enforce proper configuration in ALL environments
    if (!keyHex) {
        throw new Error(
            'CRITICAL: APP_ENCRYPTION_KEY is not set. ' +
            'Bank account encryption requires this environment variable. ' +
            'Generate with: openssl rand -hex 32 ' +
            'Add to .env.local: APP_ENCRYPTION_KEY=<generated_key>'
        )
    }

    try {
        const key = Buffer.from(keyHex, 'hex')

        if (key.length !== 32) {
            throw new Error(
                `Invalid APP_ENCRYPTION_KEY length: ${key.length} bytes. ` +
                `Expected 32 bytes (64 hex characters). ` +
                `Generate with: openssl rand -hex 32`
            )
        }

        return key
    } catch (error) {
        throw new Error(
            `Failed to parse APP_ENCRYPTION_KEY: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
            `Expected 64-character hex string. Generate with: openssl rand -hex 32`
        )
    }
}

/**
 * Encrypt a bank account number
 * Returns: base64-encoded encrypted data with format: salt:iv:authTag:ciphertext
 */
export function encryptBankAccount(plaintext: string): string {
    if (!plaintext || plaintext.trim().length === 0) {
        throw new Error('Cannot encrypt empty bank account number')
    }

    // Normalize: remove spaces and non-digits
    const normalized = plaintext.replace(/\s/g, '').replace(/\D/g, '')

    if (normalized.length !== 11) {
        throw new Error('Norwegian bank account must be exactly 11 digits')
    }

    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const salt = randomBytes(SALT_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(normalized, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: salt:iv:authTag:ciphertext (all hex-encoded)
    const combined = [
        salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted
    ].join(':')

    // Return as base64 for database storage
    return Buffer.from(combined).toString('base64')
}

/**
 * Decrypt a bank account number
 * Expects base64-encoded data with format: salt:iv:authTag:ciphertext
 */
export function decryptBankAccount(encrypted: string): string {
    if (!encrypted || encrypted.trim().length === 0) {
        throw new Error('Cannot decrypt empty value')
    }

    try {
        // Decode from base64
        const combined = Buffer.from(encrypted, 'base64').toString('utf8')
        const parts = combined.split(':')

        if (parts.length !== 4) {
            throw new Error('Invalid encrypted data format')
        }

        const [saltHex, ivHex, authTagHex, ciphertext] = parts

        const key = getEncryptionKey()
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')

        const decipher = createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        // Format with spaces for readability: XXXX XX XXXXX
        return formatBankAccount(decrypted)
    } catch (error) {
        throw new Error(
            `Failed to decrypt bank account: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
            `This could mean: (1) Wrong encryption key, (2) Corrupted data, (3) Key was rotated`
        )
    }
}

/**
 * Format Norwegian bank account number with spaces
 * Input: 12345678903
 * Output: 1234 56 78903
 */
function formatBankAccount(account: string): string {
    if (account.length !== 11) {
        return account // Return as-is if invalid length
    }

    return `${account.slice(0, 4)} ${account.slice(4, 6)} ${account.slice(6)}`
}

/**
 * Validate Norwegian bank account number
 * Uses Modulus 11 algorithm
 */
export function validateBankAccount(account: string): boolean {
    // Remove spaces
    const normalized = account.replace(/\s/g, '')

    if (!/^\d{11}$/.test(normalized)) {
        return false
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

    return calculatedCheckDigit === actualCheckDigit
}

/**
 * Generate encryption key command (for documentation)
 */
export function generateKeyCommand(): string {
    return 'openssl rand -hex 32'
}
