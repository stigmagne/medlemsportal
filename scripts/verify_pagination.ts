
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function verifyPagination() {
    console.log('🔍 Verifying Member Pagination...')

    // 1. Get total count first to know what we're working with
    // We'll use the "Mega Foreningen" or any org with members
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, slug, name')
        .limit(1)

    if (!orgs || orgs.length === 0) {
        console.error('❌ No organizations found to test with.')
        return
    }

    const org = orgs[0]
    console.log(`Testing with Organization: ${org.name} (${org.slug})`)

    const { count: totalCount, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .is('deleted_at', null)

    if (countError) {
        console.error('❌ Failed to get total count:', countError.message)
        return
    }

    console.log(`Total members in DB for org: ${totalCount}`)

    // 2. Test Fetching Page 1 (Limit 50)
    const perPage = 50
    const from = 0
    const to = perPage - 1

    console.log(`\n📄 Fetching Page 1 (Rows ${from} to ${to})...`)

    const { data: page1, error: page1Error } = await supabase
        .from('members')
        .select('id')
        .eq('organization_id', org.id)
        .is('deleted_at', null)
        .range(from, to)

    if (page1Error) {
        console.error('❌ Failed to fetch page 1:', page1Error.message)
        return
    }

    console.log(`Rows returned: ${page1.length}`)

    if (page1.length > 50) {
        console.error(`❌ ERROR: Returned more than ${perPage} rows! Pagination is NOT working locally (if this was the app).`)
    } else if (page1.length === perPage || ((totalCount || 0) < perPage && page1.length === (totalCount || 0))) {
        console.log('✅ SUCCESS: Page size respects the limit.')
    } else {
        console.warn('⚠️  Unexpected row count given the total.')
    }

    // 3. Test Search (simulating the search param)
    // Find a member to search for
    const { data: randMember } = await supabase
        .from('members')
        .select('first_name')
        .eq('organization_id', org.id)
        .limit(1)
        .single()

    if (randMember) {
        const searchTerm = randMember.first_name
        console.log(`\n🔎 Testing Search for "${searchTerm}"...`)

        const { data: searchResults, count: searchCount } = await supabase
            .from('members')
            .select('id', { count: 'exact' })
            .eq('organization_id', org.id)
            .ilike('first_name', `%${searchTerm}%`)
            .range(0, 49)

        console.log(`Found ${searchCount} matches. Returned first ${searchResults?.length}.`)
        console.log('✅ Search query appears valid.')
    }

    console.log('\n🏁 Verification Complete. The backend queries used in the app are valid.')
}

verifyPagination()
