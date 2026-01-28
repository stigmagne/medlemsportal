/**
 * Cross-Organization Access Testing Script
 * Purpose: Verify that RLS policies prevent cross-org data access
 * K5: Critical Security Task
 * 
 * This script tests that users from Organization A cannot access
 * data from Organization B through the Supabase client.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface TestResult {
    test: string;
    passed: boolean;
    details: string;
    rowCount?: number;
}

const results: TestResult[] = [];

/**
 * Test helper: Attempt to access data from a different organization
 */
async function testCrossOrgAccess(
    userEmail: string,
    userPassword: string,
    targetOrgId: string,
    tableName: string,
    testDescription: string
): Promise<TestResult> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Sign in as user
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: userPassword,
        });

        if (authError) {
            return {
                test: testDescription,
                passed: false,
                details: `Auth failed: ${authError.message}`,
            };
        }

        // Attempt to query data from target org
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .eq('org_id', targetOrgId);

        // Sign out
        await supabase.auth.signOut();

        if (error) {
            // Error is good - means RLS blocked the query
            return {
                test: testDescription,
                passed: true,
                details: `RLS blocked access: ${error.message}`,
                rowCount: 0,
            };
        }

        // If we got data, that's BAD - cross-org leak!
        const rowCount = count || data?.length || 0;
        if (rowCount > 0) {
            return {
                test: testDescription,
                passed: false,
                details: `SECURITY LEAK: Retrieved ${rowCount} rows from different org!`,
                rowCount,
            };
        }

        // No data returned - RLS working correctly
        return {
            test: testDescription,
            passed: true,
            details: 'RLS correctly returned 0 rows',
            rowCount: 0,
        };
    } catch (err) {
        return {
            test: testDescription,
            passed: false,
            details: `Unexpected error: ${err}`,
        };
    }
}

/**
 * Test storage bucket access across organizations
 */
async function testCrossOrgStorage(
    userEmail: string,
    userPassword: string,
    targetOrgId: string,
    bucketName: string,
    testDescription: string
): Promise<TestResult> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Sign in as user
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: userPassword,
        });

        if (authError) {
            return {
                test: testDescription,
                passed: false,
                details: `Auth failed: ${authError.message}`,
            };
        }

        // Attempt to list files from target org's folder
        const { data, error } = await supabase.storage
            .from(bucketName)
            .list(targetOrgId);

        // Sign out
        await supabase.auth.signOut();

        if (error) {
            // Error is good - means RLS blocked access
            return {
                test: testDescription,
                passed: true,
                details: `Storage RLS blocked access: ${error.message}`,
            };
        }

        // If we got files, that's BAD - cross-org leak!
        const fileCount = data?.length || 0;
        if (fileCount > 0) {
            return {
                test: testDescription,
                passed: false,
                details: `SECURITY LEAK: Listed ${fileCount} files from different org!`,
                rowCount: fileCount,
            };
        }

        // No files returned - RLS working correctly
        return {
            test: testDescription,
            passed: true,
            details: 'Storage RLS correctly returned 0 files',
            rowCount: 0,
        };
    } catch (err) {
        return {
            test: testDescription,
            passed: false,
            details: `Unexpected error: ${err}`,
        };
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n🔒 Cross-Organization Access Testing\n');
    console.log('This script verifies that RLS policies prevent cross-org data leaks.\n');

    // =====================================================
    // TEST CONFIGURATION
    // =====================================================
    // TODO: Replace these with actual test user credentials and org IDs
    const ORG_A_ADMIN_EMAIL = 'admin-org-a@example.com';
    const ORG_A_ADMIN_PASSWORD = 'test-password';
    const ORG_A_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const ORG_B_ID = 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy';

    console.log('⚠️  WARNING: Update test credentials in the script before running!\n');
    console.log(`Testing: User from Org A attempting to access Org B data\n`);

    // =====================================================
    // DATABASE TABLES TESTS
    // =====================================================
    console.log('📊 Testing Database Tables...\n');

    // Test members table
    results.push(
        await testCrossOrgAccess(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'members',
            'Members table cross-org access'
        )
    );

    // Test payments table
    results.push(
        await testCrossOrgAccess(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'payments',
            'Payments table cross-org access'
        )
    );

    // Test meetings table
    results.push(
        await testCrossOrgAccess(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'meetings',
            'Meetings table cross-org access'
        )
    );

    // Test case_items table
    results.push(
        await testCrossOrgAccess(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'case_items',
            'Case items table cross-org access'
        )
    );

    // Test email_campaigns table
    results.push(
        await testCrossOrgAccess(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'email_campaigns',
            'Email campaigns table cross-org access'
        )
    );

    // Test travel_expenses table
    results.push(
        await testCrossOrgAccess(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'travel_expenses',
            'Travel expenses table cross-org access'
        )
    );

    // Test payment_batches table
    results.push(
        await testCrossOrgAccess(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'payment_batches',
            'Payment batches table cross-org access'
        )
    );

    // =====================================================
    // STORAGE BUCKETS TESTS
    // =====================================================
    console.log('\n📁 Testing Storage Buckets...\n');

    // Test receipts bucket
    results.push(
        await testCrossOrgStorage(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'receipts',
            'Receipts bucket cross-org access'
        )
    );

    // Test campaign_images bucket
    results.push(
        await testCrossOrgStorage(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'campaign_images',
            'Campaign images bucket cross-org access'
        )
    );

    // Test case_attachments bucket
    results.push(
        await testCrossOrgStorage(
            ORG_A_ADMIN_EMAIL,
            ORG_A_ADMIN_PASSWORD,
            ORG_B_ID,
            'case_attachments',
            'Case attachments bucket cross-org access'
        )
    );

    // =====================================================
    // RESULTS SUMMARY
    // =====================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60) + '\n');

    let passedCount = 0;
    let failedCount = 0;

    results.forEach((result, index) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} Test ${index + 1}: ${result.test}`);
        console.log(`   ${result.details}`);
        if (result.rowCount !== undefined) {
            console.log(`   Rows/Files returned: ${result.rowCount}`);
        }
        console.log('');

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
        console.log('🚨 CRITICAL SECURITY ISSUE: Some tests failed!');
        console.log('   Cross-organization data leaks detected.');
        console.log('   Review RLS policies immediately.\n');
        process.exit(1);
    } else {
        console.log('✅ All tests passed! RLS policies are working correctly.\n');
        process.exit(0);
    }
}

// Run tests
runTests().catch((error) => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
