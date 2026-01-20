
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

async function checkAccess() {
    const email = 'stigmagnebrekken@gmail.com'
    const slug = 'test-forening'

    console.log(`Checking access for ${email} in ${slug}...`)

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) throw userError

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error('❌ User not found in Auth system.')
        return
    }

    console.log(`User ID: ${user.id}`)

    // 2. Get Org ID
    const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!org) {
        console.error('❌ Organization not found.')
        return
    }

    console.log(`Org ID: ${org.id} (${org.name})`)

    // 3. Check Access Table
    const { data: access, error: accessError } = await supabase
        .from('user_org_access')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', org.id)

    if (accessError) {
        console.error('Error fetching access:', accessError)
    }

    if (!access || access.length === 0) {
        console.error('❌ No entry in user_org_access for this user/org.')
    } else {
        console.log('✅ Access Entry Found:', access)
    }

    // 4. Check Global Superadmin Access
    console.log('Checking global SUPERADMIN access...')
    const { data: superAccess, error: superError } = await supabase
        .from('user_org_access')
        .select('*')
        .eq('user_id', user.id)
        .is('organization_id', null)
        .eq('role', 'superadmin')

    if (superError) console.error('Error fetching superadmin access:', superError)

    if (superAccess && superAccess.length > 0) {
        console.log('✅ User IS a Global Superadmin:', superAccess)
    } else {
        console.error('❌ User is NOT a Global Superadmin (no entry found).')
    }
}

checkAccess().catch(console.error)
