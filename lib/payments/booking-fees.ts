import { differenceInMinutes, differenceInDays, startOfDay } from "date-fns"

export type PriceType = 'hourly' | 'daily' | 'fixed'

export function calculateBookingFee(
    start: Date,
    end: Date,
    price: number,
    priceType: PriceType
): number {
    if (price <= 0) return 0

    if (priceType === 'fixed') {
        return price
    }

    if (priceType === 'daily') {
        // Calculate number of days spanned. 
        // If start is 23:00 and end is 01:00 next day, is it 1 or 2 days?
        // Usually daily rental implies "per commenced day" or "24h periods"?
        // Let's assume per commenced calendar day for simplicity, or 24h chunks.
        // User said "Price pr day".
        // Let's go with: difference in calendar days + 1 (if same day, 1 day).

        const startDay = startOfDay(start)
        const endDay = startOfDay(end)
        const days = differenceInDays(endDay, startDay) + 1
        return days * price
    }

    if (priceType === 'hourly') {
        const minutes = differenceInMinutes(end, start)
        const hours = Math.ceil(minutes / 60) // Ceil to nearest hour
        return hours * price
    }

    return 0
}
