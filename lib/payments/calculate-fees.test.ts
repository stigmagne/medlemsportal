import { calculateFees } from './calculate-fees';
import { createClient } from '@/lib/supabase/server';

// Mock supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

const STRIPE_FIXED = 200; // 2 NOK
const STRIPE_PERCENTAGE = 0.024;
const PLATFORM_FIXED = 500; // 5 NOK
const PLATFORM_PERCENTAGE = 0.025;

function expectedStripeFee(amount: number) {
    return Math.round(amount * STRIPE_PERCENTAGE) + STRIPE_FIXED;
}

describe('calculateFees (Stripe Connect)', () => {
    let mockSupabase: any;

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            update: jest.fn().mockReturnThis()
        };
        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    const mockOrg = (balance: number, year: number = new Date().getFullYear(), stripeId: string | null = 'acct_123', customFee: number | null = null) => {
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'organizations') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({
                        data: {
                            subscription_balance: balance,
                            subscription_year: year,
                            stripe_account_id: stripeId,
                            custom_annual_fee: customFee
                        }
                    })
                }
            }
            return mockSupabase
        })
    };

    test('Scenario A: New Year (990 NOK balance) - 200 NOK payment', async () => {
        mockOrg(990); // 990 NOK debt
        const amountInOre = 20000; // 200 NOK

        const res = await calculateFees('org1', amountInOre);

        const stripeFee = expectedStripeFee(amountInOre); // ~680
        const maxAppFee = amountInOre - stripeFee; // 19320

        // Entire amount covers debt, so App Fee takes all (minus stripe fee)
        expect(res.applicationFee).toBe(maxAppFee);
        expect(res.stripeFee).toBe(stripeFee);
        expect(res.netToOrganization).toBe(0);
        expect(res.breakdown.phase).toBe('covering_annual_fee');
    });

    test('Scenario B: Annual Fee Complete (0 NOK balance) - 200 NOK payment', async () => {
        mockOrg(0);
        const amountInOre = 20000; // 200 NOK

        const res = await calculateFees('org1', amountInOre);

        const stripeFee = expectedStripeFee(amountInOre); // 680
        const appFee = PLATFORM_FIXED + Math.round(amountInOre * PLATFORM_PERCENTAGE); // 500 + 500 = 1000

        expect(res.applicationFee).toBe(appFee); // 1000 (10 NOK)
        expect(res.stripeFee).toBe(stripeFee); // 680 (6.80 NOK)
        expect(res.netToOrganization).toBe(amountInOre - appFee - stripeFee); // 18320
        expect(res.breakdown.phase).toBe('standard_transaction');
    });

    test('Scenario C: No Stripe Account - Should throw', async () => {
        mockOrg(990, new Date().getFullYear(), null);

        await expect(calculateFees('org1', 10000))
            .rejects
            .toThrow('not completed Stripe onboarding');
    });

    test('Scenario D: Previous Year Reset', async () => {
        mockOrg(0, 2020); // Paid in 2020, now new year
        const amountInOre = 20000;

        const res = await calculateFees('org1', amountInOre);

        // Should reset to 990 NOK debt
        // Payment 200 covers part of 990.
        // App Fee takes all (minus stripe).
        const stripeFee = expectedStripeFee(amountInOre);
        const maxAppFee = amountInOre - stripeFee;

        expect(res.applicationFee).toBe(maxAppFee);
        expect(res.breakdown.subscriptionBalanceBefore).toBe(99000); // 990 * 100
    });

    test('Scenario E: Custom Annual Fee (5000 NOK)', async () => {
        // Mock a new year with a custom fee of 5000 NOK set on the org
        mockOrg(0, 2020, 'acct_123', 5000);
        const amountInOre = 20000; // 200 NOK

        const res = await calculateFees('org1', amountInOre);

        // Should reset to 5000 NOK debt (500000 øre)
        const stripeFee = expectedStripeFee(amountInOre);
        const maxAppFee = amountInOre - stripeFee;

        expect(res.applicationFee).toBe(maxAppFee);
        expect(res.breakdown.subscriptionBalanceBefore).toBe(500000); // 5000 * 100
    });
});
