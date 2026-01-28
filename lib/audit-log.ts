/**
 * SECURITY (M6): Centralized Audit Logging
 * 
 * This module provides audit logging for sensitive operations.
 * All administrative actions, permission changes, and data exports
 * should be logged for compliance and security monitoring.
 */

import { createClient } from '@/lib/supabase/server'

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'view'
    | 'export'
    | 'permission_change'
    | 'payment_processed'
    | 'member_created'
    | 'member_deleted'

export type AuditResourceType =
    | 'member'
    | 'payment'
    | 'event'
    | 'booking'
    | 'document'
    | 'org_member'
    | 'organization'
    | 'subscription'

export interface AuditLogParams {
    action: AuditAction
    resourceType: AuditResourceType
    resourceId: string
    organizationId?: string
    description?: string
    metadata?: Record<string, any>
}

/**
 * Log an audit event
 * 
 * @param params - Audit event parameters
 * @returns void - Failures are logged but don't throw to avoid disrupting operations
 * 
 * @example
 * await logAuditEvent({
 *   action: 'permission_change',
 *   resourceType: 'org_member',
 *   resourceId: memberId,
 *   organizationId: orgId,
 *   metadata: { from: 'org_member', to: 'org_admin' }
 * })
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Only log authenticated actions
        if (!user) {
            console.warn('Audit log skipped: No authenticated user')
            return
        }

        // Get user's role if organization is specified
        let userRole: string | null = null
        if (params.organizationId) {
            const { data: access } = await supabase
                .from('user_org_access')
                .select('role')
                .eq('user_id', user.id)
                .eq('organization_id', params.organizationId)
                .single()

            userRole = access?.role || null
        }

        // Insert audit log entry
        const { error } = await supabase.from('audit_log').insert({
            user_id: user.id,
            user_email: user.email,
            user_role: userRole,
            action: params.action,
            resource_type: params.resourceType,
            resource_id: params.resourceId,
            organization_id: params.organizationId,
            description: params.description,
            metadata: params.metadata,
        })

        if (error) {
            // Log error but don't throw - audit logging should not break operations
            console.error('Audit log insert failed:', error)
        }
    } catch (error) {
        // Catch-all: log server-side but don't propagate error
        console.error('Audit logging failed:', error)
    }
}

/**
 * Helper: Log permission change
 */
export async function logPermissionChange(
    memberId: string,
    orgId: string,
    fromRole: string,
    toRole: string
) {
    await logAuditEvent({
        action: 'permission_change',
        resourceType: 'org_member',
        resourceId: memberId,
        organizationId: orgId,
        description: `Changed role from ${fromRole} to ${toRole}`,
        metadata: { from: fromRole, to: toRole }
    })
}

/**
 * Helper: Log payment processing
 */
export async function logPaymentProcessed(
    paymentId: string,
    orgId: string,
    amount: number,
    status: string
) {
    await logAuditEvent({
        action: 'payment_processed',
        resourceType: 'payment',
        resourceId: paymentId,
        organizationId: orgId,
        description: `Payment processed: ${amount} NOK`,
        metadata: { amount, status, currency: 'NOK' }
    })
}

/**
 * Helper: Log member creation
 */
export async function logMemberCreated(
    memberId: string,
    orgId: string,
    memberName: string
) {
    await logAuditEvent({
        action: 'member_created',
        resourceType: 'member',
        resourceId: memberId,
        organizationId: orgId,
        description: `Created member: ${memberName}`,
        metadata: { memberName }
    })
}

/**
 * Helper: Log data export
 */
export async function logDataExport(
    resourceType: AuditResourceType,
    orgId: string,
    exportType: string,
    recordCount: number
) {
    await logAuditEvent({
        action: 'export',
        resourceType,
        resourceId: orgId,
        organizationId: orgId,
        description: `Exported ${recordCount} ${resourceType} records`,
        metadata: { exportType, recordCount }
    })
}
