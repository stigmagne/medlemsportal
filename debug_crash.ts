import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS for debugging

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { supabaseUrl, hasKey: !!supabaseKey })
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQueries() {
    console.log('Testing Members -> Organization query...')
    const { data, error } = await supabase
        .from('members')
        .select(`
            id,
            membership_status,
            organization:organizations (
                id,
                name,
                slug
            )
        `)
        .limit(5)

    if (error) {
        console.error('Members query FAILED:', error)
    } else {
        console.log('Members query SUCCESS. Rows:', data?.length)
        if (data && data.length > 0) {
            console.log('Sample row:', JSON.stringify(data[0], null, 2))
        }
    }

    console.log('\nTesting Superadmin Dashboard stats...')
    const { count: orgCount, error: orgError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

    if (orgError) console.error('Org count FAILED:', orgError)
    else console.log('Org count:', orgCount)
}

testQueries().catch(console.error)
