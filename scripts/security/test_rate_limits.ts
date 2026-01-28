/**
 * Rate Limiting Test Script
 * Purpose: Verify rate limits are enforced correctly
 * H5: High Priority Security Task
 */

import { checkRateLimit, RateLimitStrategy } from '../../lib/rate-limit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface TestResult {
    test: string;
    passed: boolean;
    details: string;
}

const results: TestResult[] = [];

/**
 * Test SMS rate limiting (10 per hour per org)
 */
async function testSmsRateLimit(): Promise<TestResult> {
    const orgId = 'test-org-' + Date.now();
    const successes: number[] = [];

    // Should allow first 10 requests
    for (let i = 1; i <= 10; i++) {
        const result = await checkRateLimit(RateLimitStrategy.SMS, orgId);
        if (result.success) {
            successes.push(i);
        }
    }

    // 11th request should fail
    const eleventhResult = await checkRateLimit(RateLimitStrategy.SMS, orgId);

    if (successes.length === 10 && !eleventhResult.success) {
        return {
            test: 'SMS Rate Limit (10/hour)',
            passed: true,
            details: `Allowed 10 requests, blocked 11th. Retry after: ${eleventhResult.retryAfter}s`,
        };
    } else {
        return {
            test: 'SMS Rate Limit (10/hour)',
            passed: false,
            details: `Expected 10 allowed, got ${successes.length}. 11th should fail but got: ${eleventhResult.success}`,
        };
    }
}

/**
 * Test payment rate limiting (3 per minute per user)
 */
async function testPaymentRateLimit(): Promise<TestResult> {
    const userId = 'test-user-' + Date.now();
    const successes: number[] = [];

    // Should allow first 3 requests
    for (let i = 1; i <= 3; i++) {
        const result = await checkRateLimit(RateLimitStrategy.PAYMENT, userId);
        if (result.success) {
            successes.push(i);
        }
    }

    // 4th request should fail
    const fourthResult = await checkRateLimit(RateLimitStrategy.PAYMENT, userId);

    if (successes.length === 3 && !fourthResult.success) {
        return {
            test: 'Payment Rate Limit (3/min)',
            passed: true,
            details: `Allowed 3 requests, blocked 4th. Retry after: ${fourthResult.retryAfter}s`,
        };
    } else {
        return {
            test: 'Payment Rate Limit (3/min)',
            passed: false,
            details: `Expected 3 allowed, got ${successes.length}. 4th should fail but got: ${fourthResult.success}`,
        };
    }
}

/**
 * Test email campaign rate limiting (5 per hour per org)
 */
async function testEmailCampaignRateLimit(): Promise<TestResult> {
    const orgId = 'test-org-email-' + Date.now();
    const successes: number[] = [];

    // Should allow first 5 requests
    for (let i = 1; i <= 5; i++) {
        const result = await checkRateLimit(RateLimitStrategy.EMAIL_CAMPAIGN, orgId);
        if (result.success) {
            successes.push(i);
        }
    }

    // 6th request should fail
    const sixthResult = await checkRateLimit(RateLimitStrategy.EMAIL_CAMPAIGN, orgId);

    if (successes.length === 5 && !sixthResult.success) {
        return {
            test: 'Email Campaign Rate Limit (5/hour)',
            passed: true,
            details: `Allowed 5 requests, blocked 6th. Retry after: ${sixthResult.retryAfter}s`,
        };
    } else {
        return {
            test: 'Email Campaign Rate Limit (5/hour)',
            passed: false,
            details: `Expected 5 allowed, got ${successes.length}. 6th should fail but got: ${sixthResult.success}`,
        };
    }
}

/**
 * Test authentication rate limiting (5 per 15 min per IP)
 */
async function testAuthRateLimit(): Promise<TestResult> {
    const ipAddress = '192.168.1.' + Math.floor(Math.random() * 255);
    const successes: number[] = [];

    // Should allow first 5 requests
    for (let i = 1; i <= 5; i++) {
        const result = await checkRateLimit(RateLimitStrategy.AUTH, ipAddress);
        if (result.success) {
            successes.push(i);
        }
    }

    // 6th request should fail
    const sixthResult = await checkRateLimit(RateLimitStrategy.AUTH, ipAddress);

    if (successes.length === 5 && !sixthResult.success) {
        return {
            test: 'Auth Rate Limit (5/15min)',
            passed: true,
            details: `Allowed 5 requests, blocked 6th. Retry after: ${sixthResult.retryAfter}s`,
        };
    } else {
        return {
            test: 'Auth Rate Limit (5/15min)',
            passed: false,
            details: `Expected 5 allowed, got ${successes.length}. 6th should fail but got: ${sixthResult.success}`,
        };
    }
}

/**
 * Test file upload rate limiting (20 per hour per user)
 */
async function testFileUploadRateLimit(): Promise<TestResult> {
    const userId = 'test-user-upload-' + Date.now();
    const successes: number[] = [];

    // Should allow first 20 requests
    for (let i = 1; i <= 20; i++) {
        const result = await checkRateLimit(RateLimitStrategy.FILE_UPLOAD, userId);
        if (result.success) {
            successes.push(i);
        }
    }

    // 21st request should fail
    const twentyFirstResult = await checkRateLimit(RateLimitStrategy.FILE_UPLOAD, userId);

    if (successes.length === 20 && !twentyFirstResult.success) {
        return {
            test: 'File Upload Rate Limit (20/hour)',
            passed: true,
            details: `Allowed 20 requests, blocked 21st. Retry after: ${twentyFirstResult.retryAfter}s`,
        };
    } else {
        return {
            test: 'File Upload Rate Limit (20/hour)',
            passed: false,
            details: `Expected 20 allowed, got ${successes.length}. 21st should fail but got: ${twentyFirstResult.success}`,
        };
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n🔒 Rate Limiting Test Suite\n');
    console.log('Testing rate limit enforcement for all strategies...\n');

    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.log('⚠️  WARNING: Upstash Redis not configured');
        console.log('   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local');
        console.log('   Tests will run but rate limiting will be disabled (graceful fallback)\n');
    }

    // Run all tests
    console.log('📊 Running tests...\n');

    results.push(await testSmsRateLimit());
    results.push(await testPaymentRateLimit());
    results.push(await testEmailCampaignRateLimit());
    results.push(await testAuthRateLimit());
    results.push(await testFileUploadRateLimit());

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60) + '\n');

    let passedCount = 0;
    let failedCount = 0;

    results.forEach((result, index) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} Test ${index + 1}: ${result.test}`);
        console.log(`   ${result.details}\n`);

        if (result.passed) {
            passedCount++;
        } else {
            failedCount++;
        }
    });

    console.log('='.repeat(60));
    console.log(`TOTAL: ${results.length} tests`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('='.repeat(60) + '\n');

    if (failedCount > 0) {
        console.log('🚨 Some rate limit tests failed!');
        console.log('   Review rate limiting configuration.\n');
        process.exit(1);
    } else {
        console.log('✅ All rate limit tests passed!\n');
        process.exit(0);
    }
}

// Run tests
runTests().catch((error) => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
