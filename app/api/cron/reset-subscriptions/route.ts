import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // Verifiser at dette er et Vercel Cron Job
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const currentYear = new Date().getFullYear()

    // Reset alle organisasjoner som har gammelt år
    const { data, error } = await supabase
        .from('organizations')
        .update({
            subscription_balance: 990,
            subscription_year: currentYear,
            subscription_paid_at: null
        })
        .lt('subscription_year', currentYear)
        .select('id, name')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Reset ${data.length} organizations for year ${currentYear}`)

    return NextResponse.json({
        success: true,
        resetCount: data.length,
        year: currentYear
    })
}
