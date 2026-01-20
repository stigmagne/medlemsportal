import { calculateFees } from './calculate-fees';
import { createClient } from '@/lib/supabase/server';

// Mock supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

describe('calculateFees', () => {
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

    const mockOrg = (balance: number, year: number = new Date().getFullYear(), planName: string = 'Årsabonnement', planPrice: number = 990) => {
        // Setup mock for organizations query
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'organizations') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({
                        data: {
                            subscription_balance: balance,
                            subscription_year: year,
                            subscription_plan: planName
                        }
                    }),
                    // Also mock update for subsequent calls
                    update: mockSupabase.update
                }
            }
            if (table === 'subscription_plans') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { price: planPrice } })
                }
            }
            return mockSupabase
        })
    };

    const verifyUpdate = (expectedBalance: number) => {
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            subscription_balance: expectedBalance,
            subscription_year: new Date().getFullYear()
        }));
    };

    test('Scenario A: New Year (990 balance) - 200 payment', async () => {
        mockOrg(990); // 990 remaining
        const res = await calculateFees('org1', 200);

        expect(res.platformFee).toBe(200);
        expect(res.transactionFee).toBe(0);
        expect(res.netToOrganization).toBe(0);
        expect(res.breakdown.phase).toBe('covering_annual_fee');

        verifyUpdate(790); // 990 - 200 = 790
    });

    test('Scenario B: Partial (790 balance) - 500 payment', async () => {
        mockOrg(790);
        const res = await calculateFees('org1', 500);

        expect(res.platformFee).toBe(500);
        expect(res.transactionFee).toBe(0);
        expect(res.netToOrganization).toBe(0);

        verifyUpdate(290); // 790 - 500 = 290
    });

    test('Scenario C: Soft Cap (190 balance) - 200 payment', async () => {
        mockOrg(190);
        const res = await calculateFees('org1', 200);

        // Remaining fee is 190. Payment is 200.
        // Platform gets 190. Org gets 10. No tx fee.
        expect(res.platformFee).toBe(190);
        expect(res.transactionFee).toBe(0);
        expect(res.netToOrganization).toBe(10);
        expect(res.breakdown.phase).toBe('annual_fee_complete');

        verifyUpdate(0); // Fully paid
    });

    test('Scenario D: Full Paid (0 balance) - 200 payment', async () => {
        mockOrg(0);
        const res = await calculateFees('org1', 200);

        expect(res.platformFee).toBe(0);
        expect(res.transactionFee).toBe(15);
        expect(res.netToOrganization).toBe(185);
        expect(res.breakdown.phase).toBe('standard_transaction');

        // Should not update org if balance is 0 and year is correct
        expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    test('Scenario: Previous Year Reset', async () => {
        mockOrg(0, 2020); // Paid 0 (full) in 2020, but now it's a new year
        const res = await calculateFees('org1', 200);

        // Lazy reset should set balance to 990 internally
        // Payment 200 -> Platform gets 200
        expect(res.platformFee).toBe(200);
        expect(res.breakdown.subscriptionBalanceBefore).toBe(990);

        verifyUpdate(790); // Updated with current year and new balance
    });
});
