/**
 * Rate Limiting Utility
 * Purpose: Protect critical endpoints from abuse
 * H5: High Priority Security Task
 * 
 * Uses Upstash Redis for distributed rate limiting across multiple instances.
 * Gracefully falls back to allowing requests if Redis is unavailable.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;
let rateLimiters: Map<string, Ratelimit> = new Map();

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
} catch (error) {
    console.error('[RateLimit] Failed to initialize Redis:', error);
}

/**
 * Rate limit strategies for different use cases
 */
export const RateLimitStrategy = {
    /**
     * SMS: 10 requests per hour per organization
     * Very restrictive to prevent SMS spam and cost overruns
     */
    SMS: 'sms',

    /**
     * Authentication: 5 login attempts per 15 minutes per IP
     * Protects against brute force attacks
     */
    AUTH: 'auth',

    /**
     * Payments: 3 payment initiations per minute per user
     * Prevents accidental double-charging and spam
     */
    PAYMENT: 'payment',

    /**
     * Email Campaigns: 5 campaigns per hour per organization
     * Prevents email spam and accidental mass sends
     */
    EMAIL_CAMPAIGN: 'email_campaign',

    /**
     * File Upload: 20 uploads per hour per user
     * Prevents storage abuse
     */
    FILE_UPLOAD: 'file_upload',

    /**
     * Onboarding: 5 requests per hour per user
     * Prevents spam creation of Stripe accounts
     */
    ONBOARDING: 'onboarding',

    /**
     * Webhooks: 100 requests per minute per IP
     * Flood protection for webhook endpoints
     */
    WEBHOOK: 'webhook',
} as const;

export type RateLimitStrategyType = typeof RateLimitStrategy[keyof typeof RateLimitStrategy];

/**
 * Get or create a rate limiter for the specified strategy
 */
function getRateLimiter(strategy: RateLimitStrategyType): Ratelimit | null {
    if (!redis) {
        return null;
    }

    if (rateLimiters.has(strategy)) {
        return rateLimiters.get(strategy)!;
    }

    let limiter: Ratelimit;

    switch (strategy) {
        case RateLimitStrategy.SMS:
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(10, '1 h'),
                analytics: true,
                prefix: 'ratelimit:sms',
            });
            break;

        case RateLimitStrategy.AUTH:
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(5, '15 m'),
                analytics: true,
                prefix: 'ratelimit:auth',
            });
            break;

        case RateLimitStrategy.PAYMENT:
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(3, '1 m'),
                analytics: true,
                prefix: 'ratelimit:payment',
            });
            break;

        case RateLimitStrategy.EMAIL_CAMPAIGN:
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(5, '1 h'),
                analytics: true,
                prefix: 'ratelimit:email',
            });
            break;

        case RateLimitStrategy.FILE_UPLOAD:
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(20, '1 h'),
                analytics: true,
                prefix: 'ratelimit:upload',
            });
            break;

        case RateLimitStrategy.ONBOARDING:
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(5, '1 h'),
                analytics: true,
                prefix: 'ratelimit:onboarding',
            });
            break;

        case RateLimitStrategy.WEBHOOK:
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(100, '1 m'),
                analytics: true,
                prefix: 'ratelimit:webhook',
            });
            break;

        default:
            // Default: 60 requests per minute
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(60, '1 m'),
                analytics: true,
                prefix: 'ratelimit:default',
            });
    }

    rateLimiters.set(strategy, limiter);
    return limiter;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

/**
 * Check if an action is rate limited
 * 
 * @param strategy - The rate limiting strategy to use
 * @param identifier - Unique identifier for the rate limit (e.g., user_id, org_id, ip_address)
 * @returns Rate limit result indicating if the action is allowed
 */
export async function checkRateLimit(
    strategy: RateLimitStrategyType,
    identifier: string
): Promise<RateLimitResult> {
    // If rate limiting is disabled or Redis unavailable, allow the request
    if (process.env.RATE_LIMIT_ENABLED === 'false' || !redis) {
        console.warn('[RateLimit] Rate limiting disabled or Redis unavailable - allowing request');
        return {
            success: true,
            limit: 999999,
            remaining: 999999,
            reset: Date.now() + 60000,
        };
    }

    const limiter = getRateLimiter(strategy);
    if (!limiter) {
        // Graceful fallback - allow request if limiter creation failed
        console.error('[RateLimit] Failed to create limiter - allowing request');
        return {
            success: true,
            limit: 999999,
            remaining: 999999,
            reset: Date.now() + 60000,
        };
    }

    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        const result: RateLimitResult = {
            success,
            limit,
            remaining,
            reset,
        };

        if (!success) {
            // Calculate retry-after in seconds
            result.retryAfter = Math.ceil((reset - Date.now()) / 1000);

            // Log rate limit violation
            console.warn('[RateLimit] Rate limit exceeded', {
                strategy,
                identifier: identifier.substring(0, 8) + '...', // Partial identifier for privacy
                limit,
                reset: new Date(reset).toISOString(),
            });
        }

        return result;
    } catch (error) {
        // Graceful fallback - allow request if rate limit check fails
        console.error('[RateLimit] Error checking rate limit - allowing request:', error);
        return {
            success: true,
            limit: 999999,
            remaining: 999999,
            reset: Date.now() + 60000,
        };
    }
}

/**
 * Rate limit error for use in API routes
 */
export class RateLimitError extends Error {
    constructor(
        public readonly retryAfter: number,
        public readonly limit: number,
        public readonly reset: number
    ) {
        super('Rate limit exceeded');
        this.name = 'RateLimitError';
    }
}

/**
 * Middleware helper for rate limiting
 * Throws RateLimitError if rate limit exceeded
 * 
 * @param strategy - The rate limiting strategy to use
 * @param identifier - Unique identifier for the rate limit
 */
export async function enforceRateLimit(
    strategy: RateLimitStrategyType,
    identifier: string
): Promise<void> {
    const result = await checkRateLimit(strategy, identifier);

    if (!result.success) {
        throw new RateLimitError(
            result.retryAfter || 60,
            result.limit,
            result.reset
        );
    }
}

/**
 * Format rate limit headers for HTTP responses
 */
export function formatRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    };

    if (!result.success && result.retryAfter) {
        headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
}

/**
 * Hash an IP address for privacy-preserving rate limiting
 * Uses simple hash to avoid storing raw IPs in Redis
 */
export function hashIdentifier(identifier: string): string {
    // Use crypto.subtle in production, simple hash for now
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        const char = identifier.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return `hashed_${Math.abs(hash).toString(36)}`;
}
