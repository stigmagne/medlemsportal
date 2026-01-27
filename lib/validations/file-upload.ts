import { z } from 'zod'

/**
 * File Upload Validation
 * 
 * Provides validation schemas and utilities for secure file uploads.
 * Used to prevent malicious file uploads and ensure file size limits.
 */

// Allowed MIME types for different upload contexts
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
] as const

export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain'
] as const

export const ALLOWED_RECEIPT_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    'application/pdf'
] as const

export const ALLOWED_CASE_ATTACHMENT_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES
] as const

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_RECEIPT_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Validate file type
 */
export function validateFileType(
    file: File,
    allowedTypes: readonly string[]
): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        }
    }
    return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(
    file: File,
    maxSize: number
): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
        return {
            valid: false,
            error: `File too large (${fileSizeMB}MB). Maximum size: ${maxSizeMB}MB`
        }
    }
    return { valid: true }
}

/**
 * Validate file for receipt uploads
 */
export function validateReceiptFile(file: File): { valid: boolean; error?: string } {
    const typeCheck = validateFileType(file, ALLOWED_RECEIPT_TYPES)
    if (!typeCheck.valid) return typeCheck

    const sizeCheck = validateFileSize(file, MAX_RECEIPT_SIZE)
    if (!sizeCheck.valid) return sizeCheck

    return { valid: true }
}

/**
 * Validate file for case attachments
 */
export function validateCaseAttachment(file: File): { valid: boolean; error?: string } {
    const typeCheck = validateFileType(file, ALLOWED_CASE_ATTACHMENT_TYPES)
    if (!typeCheck.valid) return typeCheck

    const sizeCheck = validateFileSize(file, MAX_FILE_SIZE)
    if (!sizeCheck.valid) return sizeCheck

    return { valid: true }
}

/**
 * Validate file for campaign images
 */
export function validateCampaignImage(file: File): { valid: boolean; error?: string } {
    const typeCheck = validateFileType(file, ALLOWED_IMAGE_TYPES)
    if (!typeCheck.valid) return typeCheck

    const sizeCheck = validateFileSize(file, MAX_IMAGE_SIZE)
    if (!sizeCheck.valid) return sizeCheck

    return { valid: true }
}

/**
 * Zod schema for file validation in forms
 */
export const fileUploadSchema = z.object({
    file: z.custom<File>((val) => val instanceof File, 'Must be a file'),
    purpose: z.enum(['receipt', 'case_attachment', 'campaign_image'])
})

/**
 * Generic file validator for server actions
 */
export function validateFileUpload(
    file: File,
    purpose: 'receipt' | 'case_attachment' | 'campaign_image'
): { valid: boolean; error?: string } {
    switch (purpose) {
        case 'receipt':
            return validateReceiptFile(file)
        case 'case_attachment':
            return validateCaseAttachment(file)
        case 'campaign_image':
            return validateCampaignImage(file)
        default:
            return { valid: false, error: 'Unknown file purpose' }
    }
}
