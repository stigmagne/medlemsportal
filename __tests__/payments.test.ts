import { calculatePayoutForPayment } from '@/app/actions/payments'
import { createClient } from '@/lib/supabase/server'

// Mock createClient
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}))

describe('calculatePayoutForPayment', () => {
    let mockSupabase: any

    beforeEach(() => {
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            update: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis()
        };
        (createClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    it('Scenario 1 (Phase 1): Payment fully covers subscription (Low amount)', async () => {
        // Mock Org: Balance 990
        mockSupabase.single.mockResolvedValue({
            data: { subscription_balance: 990, subscription_year: 2026, subscription_paid_at: null },
            error: null
        })

        const result = await calculatePayoutForPayment('org-1', 100)

        expect(result.subscriptionDeduction).toBe(100)
        expect(result.serviceFee).toBe(0)
        expect(result.payoutToOrg).toBe(0)
        expect(result.remainingSubscriptionBalance).toBe(890)
        expect(result.subscriptionFullyPaid).toBe(false)
    })

    it('Scenario 2 (Phase 1 -> 2): Payment crosses the threshold (Crossover)', async () => {
        // Mock Org: Balance 50 (Only 50 left to pay)
        mockSupabase.single.mockResolvedValue({
            data: { subscription_balance: 50, subscription_year: 2026, subscription_paid_at: null },
            error: null
        })

        // Payment of 100
        const result = await calculatePayoutForPayment('org-1', 100)

        // Should deduct 50 (clearing balance), 0 fee on the rest (per strictly defined logic), 50 payout
        expect(result.subscriptionDeduction).toBe(50)
        expect(result.serviceFee).toBe(0)
        expect(result.payoutToOrg).toBe(50)
        expect(result.remainingSubscriptionBalance).toBe(0)
        expect(result.subscriptionFullyPaid).toBe(true)
    })

    it('Scenario 3 (Phase 2): Standard transaction fee (Normal drift)', async () => {
        // Mock Org: Balance 0 (Fully paid)
        mockSupabase.single.mockResolvedValue({
            data: { subscription_balance: 0, subscription_year: 2026, subscription_paid_at: '2026-01-01' },
            error: null
        })

        // Payment of 100
        // Fee: 5 + (100 * 0.025) = 5 + 2.5 = 7.50
        const result = await calculatePayoutForPayment('org-1', 100)

        expect(result.subscriptionDeduction).toBe(0)
        expect(result.serviceFee).toBe(7.50)
        expect(result.payoutToOrg).toBe(92.50)
        expect(result.remainingSubscriptionBalance).toBe(0)
    })

    it('Scenario 4 (Year Reset): Unpaid from previous year resets to 990', async () => {
        // Mock Org: Balance 500, Year 2025 (Old year)
        mockSupabase.single.mockResolvedValue({
            data: { subscription_balance: 500, subscription_year: 2025, subscription_paid_at: null },
            error: null
        })

        // Logic should detect old year, reset balance to 990 internally before calculating
        // Payment 100
        const result = await calculatePayoutForPayment('org-1', 100)

        expect(result.subscriptionDeduction).toBe(100)
        expect(result.remainingSubscriptionBalance).toBe(890) // 990 - 100
        // Check if update was called with reset values
        expect(mockSupabase.update).toHaveBeenCalledWith(
            expect.objectContaining({
                subscription_balance: 990,
                subscription_year: new Date().getFullYear()
            })
        )
    })
})
