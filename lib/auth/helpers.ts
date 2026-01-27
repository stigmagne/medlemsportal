'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Authentication and Authorization Helpers
 * 
 * These functions provide consistent security checks across all server actions.
 * They prevent critical vulnerabilities:
 * - Unauthenticated access (missing auth checks)
 * - IDOR (Insecure Direct Object Reference)
 * - Unauthorized cross-org operations
 */

export type OrgRole = 'org_owner' | 'org_admin' | 'org_member' | 'superadmin'

export interface AuthResult {
    user: {
        id: string
        email: string
    }
}

export interface OrgAccessResult extends AuthResult {
    orgId: string
    orgAccess: {
        role: OrgRole
        organizationId: string
    }
}

/**
 * Requires user to be authenticated.
 * Throws error if not logged in.
 * 
 * @throws Error if user is not authenticated
 * @returns User object with id and email
 * 
 * @example
 * export async function myServerAction() {
 *   const { user } = await requireAuth()
 *   // ... proceed with authenticated user
 * }
 */
export async function requireAuth(): Promise<AuthResult> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Autentisering påkrevd. Vennligst logg inn.')
    }

    return {
        user: {
            id: user.id,
            email: user.email || ''
        }
    }
}

/**
 * Requires user to have access to a specific organization.
 * Verifies membership via orgSlug lookup and user_org_access table.
 * 
 * This prevents IDOR attacks by:
 * 1. Never trusting orgId from client
 * 2. Looking up org via URL slug (server-controlled)
 * 3. Verifying user membership in that org
 * 
 * @param orgSlug - Organization slug from URL path (e.g. 'min-forening')
 * @param requiredRole - Optional minimum role required (defaults to 'org_member')
 * @throws Error if user doesn't have access or org not found
 * @returns User, orgId, and access details
 * 
 * @example
 * export async function createMember(slug: string, data: MemberInput) {
 *   const { user, orgId } = await requireOrgAccess(slug, 'org_admin')
 *   // ... create member in orgId (not from client!)
 * }
 */
export async function requireOrgAccess(
    orgSlug: string,
    requiredRole: OrgRole = 'org_member'
): Promise<OrgAccessResult> {
    const { user } = await requireAuth()
    const supabase = await createClient()

    // 1. Look up organization by slug (server-controlled, not from client)
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single()

    if (orgError || !org) {
        throw new Error('Organisasjon ikke funnet')
    }

    // 2. Verify user has access to this org
    const { data: access, error: accessError } = await supabase
        .from('user_org_access')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', org.id)
        .single()

    if (accessError || !access) {
        throw new Error('Du har ikke tilgang til denne organisasjonen')
    }

    // 3. Verify user has required role
    if (!hasRequiredRole(access.role, requiredRole)) {
        throw new Error(`Krever ${getRoleDisplayName(requiredRole)}-tilgang`)
    }

    return {
        user,
        orgId: org.id,
        orgAccess: {
            role: access.role,
            organizationId: access.organization_id
        }
    }
}

/**
 * Requires user to have a specific role globally (e.g. superadmin).
 * 
 * @param requiredRole - The role required (typically 'superadmin')
 * @throws Error if user doesn't have the required role
 * @returns User object
 * 
 * @example
 * export async function runNewYearRenewal() {
 *   await requireRole('superadmin')
 *   // ... perform critical system-wide operation
 * }
 */
export async function requireRole(requiredRole: OrgRole): Promise<AuthResult> {
    const { user } = await requireAuth()
    const supabase = await createClient()

    // Check for superadmin (organization_id is NULL)
    if (requiredRole === 'superadmin') {
        const { data: access, error } = await supabase
            .from('user_org_access')
            .select('role')
            .eq('user_id', user.id)
            .is('organization_id', null)
            .eq('role', 'superadmin')
            .single()

        if (error || !access) {
            throw new Error('Krever superadmin-tilgang')
        }
    }

    return { user }
}

/**
 * Check if user role meets the required role level.
 * Role hierarchy: superadmin > org_owner > org_admin > org_member
 */
function hasRequiredRole(userRole: string, requiredRole: OrgRole): boolean {
    const roleHierarchy: Record<string, number> = {
        'superadmin': 4,
        'org_owner': 3,
        'org_admin': 2,
        'org_member': 1
    }

    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    return userLevel >= requiredLevel
}

/**
 * Get user-friendly display name for role
 */
function getRoleDisplayName(role: OrgRole): string {
    const displayNames: Record<OrgRole, string> = {
        'superadmin': 'Superadministrator',
        'org_owner': 'Eier',
        'org_admin': 'Administrator',
        'org_member': 'Medlem'
    }

    return displayNames[role] || role
}
