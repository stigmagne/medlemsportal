/**
 * KID Generation utilities (Modulus 10)
 */

/**
 * Calculates Modulus 10 checksum digit (Luhn algorithm).
 */
export function calculateMod10(input: string): number {
    let sum = 0;
    let double = true; // Start from right-most digit (excluding check digit placeholder), moving left

    // Iterate efficiently from right to left
    for (let i = input.length - 1; i >= 0; i--) {
        let digit = parseInt(input.charAt(i), 10);

        if (double) {
            digit *= 2;
            if (digit > 9) digit -= 9; // Same as sum of digits for 2*d (e.g. 18 -> 1+8=9, or 18-9=9)
        }

        sum += digit;
        double = !double;
    }

    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Generates a KID number.
 * Format: [Prefix][Reference][Checksum]
 * 
 * Prefix: Optional, useful for identifying org/type.
 * Reference: Unique identifier (e.g. Transaction ID hash or Member ID + Date).
 * 
 * For MVP we use a simplified approach:
 * 8-15 digits.
 * We'll use a numeric hash of the UUID + Timestamp to ensure uniqueness but purely numeric.
 * OR strictly: Account ID (if numeric) + Customer ID.
 * 
 * Since we don't have numeric stable IDs for everything, we will generate a random 
 * but tracked numeric sequence or simply use a strong random number + checksum for MVP,
 * stored in DB with unique constraint check.
 */
export function generateKid(reference: string, prefix: string = ''): string {
    // Basic implementation: Concatenate prefix and numeric reference, then append checksum.
    // Ensure input is purely numeric.

    // If reference contains non-numeric chars, we must sanitize or hash it.
    // For now, let's assume the caller provides a numeric string (e.g. a Customer Number).

    const base = `${prefix}${reference}`;
    if (!/^\d+$/.test(base)) {
        throw new Error('KID base must be numeric');
    }

    const checksum = calculateMod10(base);
    return `${base}${checksum}`;
}

/**
 * Generates a candidate numeric reference from a text string (like UUID)
 * by taking a portion of its hash or numeric conversion. 
 * Warning: Collisions possible, must rely on DB unique check.
 */
export function generateNumericReference(): string {
    // Generate a timestamp-based random number
    // Format: YYMMDD + 5 random digits. Length: 6 + 5 = 11 digits.
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD

    // SECURITY: Use crypto.randomInt() instead of Math.random() for cryptographic randomness
    const { randomInt } = require('crypto');
    const random = randomInt(0, 100000).toString().padStart(5, '0');

    return `${dateStr}${random}`;
}
