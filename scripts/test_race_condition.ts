
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

const SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function testRaceCondition() {
    console.log('🏎️  Starting Race Condition Test: Double Booking\n')

    // 1. Setup Resource
    // Use Mega Foreningen
    const { data: org } = await supabaseAdmin.from('organizations').select('id').eq('slug', 'mega-foreningen').single()
    if (!org) throw new Error('Mega Foreningen not found')

    // Create a resource
    const resourceName = `Race-Resource-${Date.now()}`
    const { data: resource, error: resError } = await supabaseAdmin.from('resources').insert({
        organization_id: org.id,
        name: resourceName,
        description: 'Race condition test resource',
        hourly_rate: 0
    }).select().single()

    if (resError) throw resError
    console.log(`   Created resource: ${resourceName}`)

    // 2. Simulate User
    // We need a user ID for the booking. We can use a fake UUID since RLS might be bypassed by Service Role, 
    // BUT our code logic validation relies on "user".
    // Wait, we are testing the SERVER ACTION logic? 
    // We can't easily call server actions from a script.
    // We can only test DATABASE constraints here.

    // If we test DATABASE constraints:
    // We should try to insert 2 overlapping bookings directly via Supabase client.
    // If the database has `exclude` constraint using `gist`, it should fail.
    // If it relies on application level check, it might succeed if we use Promise.all.

    console.log('   Attempting concurrent inserts (Database level check)...')

    const bookingTime = new Date()
    bookingTime.setDate(bookingTime.getDate() + 1)
    bookingTime.setHours(12, 0, 0, 0)
    const startTime = bookingTime.toISOString()
    const endTime = new Date(bookingTime.getTime() + 60 * 60 * 1000).toISOString() // 1 hour

    // User A
    const userA = '00000000-0000-0000-0000-000000000000' // valid uuid format?
    // Postgres UUID must be valid.
    const user1Id = '11111111-1111-4111-8111-111111111111'
    const user2Id = '22222222-2222-4222-8222-222222222222'

    // Simultaneous Insert
    const insertBooking = (userId: string) => supabaseAdmin.from('resource_bookings').insert({
        resource_id: resource.id,
        user_id: userId,
        organization_id: org.id,
        start_time: startTime,
        end_time: endTime,
        status: 'confirmed'
    })

    const results = await Promise.all([
        insertBooking(user1Id),
        insertBooking(user2Id)
    ])

    const successCount = results.filter(r => !r.error).length
    const errors = results.filter(r => r.error).map(r => r.error)

    if (successCount > 1) {
        console.error('   ❌ RACE CONDITION FAIL: Both bookings were inserted!')
        console.log('   The database lacks proper EXCLUSION constraints.')
    } else if (successCount === 1) {
        console.log('   ✅ Race condition prevented (1 success, 1 fail).')
        if (errors.length) console.log('   Error:', errors[0]?.message)
    } else {
        console.log('   ⚠️  Both failed.', errors)
    }
}

testRaceCondition().catch(console.error)
