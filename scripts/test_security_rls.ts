
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

const SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    console.error('Missing environment variables')
    process.exit(1)
}

// Create admin client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function runSecurityTest() {
    console.log('🔒 Starting Security Audit: RLS & Access Control\n')

    // 1. Setup: Ensure we have two organizations and two users
    console.log('1️⃣  Setup: Verifying test data...')

    // Get or create org A
    let { data: orgA } = await supabaseAdmin.from('organizations').select('id, slug').eq('slug', 'org-a-test').single()
    if (!orgA) {
        const { data, error } = await supabaseAdmin.from('organizations').insert({ name: 'Org A Test', slug: 'org-a-test' }).select().single()
        if (error) throw error
        orgA = data
        console.log('   Created Org A')
    }

    // Get or create org B
    let { data: orgB } = await supabaseAdmin.from('organizations').select('id, slug').eq('slug', 'org-b-test').single()
    if (!orgB) {
        const { data, error } = await supabaseAdmin.from('organizations').insert({ name: 'Org B Test', slug: 'org-b-test' }).select().single()
        if (error) throw error
        orgB = data
        console.log('   Created Org B')
    }

    // Get a real user ID to impersonate (using one from recent debugging if possible, or create a dummy user)
    // For this test, valid auth user IDs are crucial. 
    // We will assume we have a user. If not, we'd need to signUp one.
    // Let's list users to pick from.
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    if (usersError || !users || users.length < 2) {
        console.error('❌ Need at least 2 users in the system to run this test effectively.')
        return
    }

    const user1 = users[0]
    const user2 = users[1]

    console.log(`   User 1: ${user1.email} (${user1.id})`)
    console.log(`   User 2: ${user2.email} (${user2.id})`)

    // Ensure User 1 is ONLY in Org A
    await supabaseAdmin.from('members').delete().eq('email', user1.email!)
    await supabaseAdmin.from('user_org_access').delete().eq('user_id', user1.id)

    await supabaseAdmin.from('members').insert({
        organization_id: orgA!.id,
        first_name: 'Test',
        last_name: 'User 1',
        email: user1.email,
        member_number: '1001'
    })
    await supabaseAdmin.from('user_org_access').insert({
        user_id: user1.id,
        organization_id: orgA!.id,
        role: 'member'
    })
    console.log('   User 1 assigned to Org A')


    // Ensure User 2 is ONLY in Org B
    await supabaseAdmin.from('members').delete().eq('email', user2.email!)
    await supabaseAdmin.from('user_org_access').delete().eq('user_id', user2.id) // Cleanup previous access

    await supabaseAdmin.from('members').insert({
        organization_id: orgB!.id,
        first_name: 'Test',
        last_name: 'User 2',
        email: user2.email,
        member_number: '2001'
    })

    // NOTE: user_org_access is often created by triggers or manual admin. 
    // We insert it here to simulate proper membership.
    await supabaseAdmin.from('user_org_access').insert({
        user_id: user2.id,
        organization_id: orgB!.id,
        role: 'member'
    })
    console.log('   User 2 assigned to Org B')


    // 2. Test: Can User 1 see User 2's member profile? (Cross-Tenant Leak)
    console.log('\n2️⃣  Test: Cross-Org Data Leakage')

    // Create client as User 1

    // Create client as User 1 - SKIP complex simulation, we will rely on the fresh test user below for the main leakage test
    // But for completeness, let's just use the fresh user for checking cross-tenant access.

    // BETTER APPROACH: Create a temporary test user with known password
    const testEmail = `stress_test_${Date.now()}@test.com`
    const testPassword = 'password123'
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: testEmail,
        password: testPassword
    })
    if (authError) throw authError
    const testUser = authData.user!
    console.log(`   Created temp user: ${testEmail}`)

    // Create a client for this test user
    const { data: sessionData } = await supabaseAdmin.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    })
    const testUserToken = sessionData.session?.access_token
    if (!testUserToken) throw new Error('Could not login as test user')

    const clientAsUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${testUserToken}` } }
    })

    // Assign test user to Org A
    await supabaseAdmin.from('members').insert({
        organization_id: orgA!.id,
        first_name: 'Stress',
        last_name: 'Tester',
        email: testEmail,
        member_number: '9999'
    })
    await supabaseAdmin.from('user_org_access').insert({
        user_id: testUser.id,
        organization_id: orgA!.id,
        role: 'member'
    })

    // ATTEMPT 1: Fetch members from Org B (should fail or return empty)
    const { data: leakageData, error: leakageError } = await clientAsUser
        .from('members')
        .select('*')
        .eq('organization_id', orgB!.id)

    if (leakageError) {
        console.log('   ✅ Query failed (Expected)')
    } else if (leakageData && leakageData.length > 0) {
        console.error('   ❌ SECURITY FAIL: Can see members from Org B!', leakageData)
    } else {
        console.log('   ✅ returned 0 rows from Org B (Expected)')
    }

    // ATTEMPT 2: Fetch own Org A members (should work depending on policy)
    // Current policy: Members can only see themselves? Or all members?
    // Let's check what we get.
    const { data: orgAData } = await clientAsUser
        .from('members')
        .select('*')
        .eq('organization_id', orgA!.id)

    console.log(`   ℹ️  Visible members in own Org: ${orgAData?.length}`)
    if (orgAData?.length === 1 && orgAData[0].email === testEmail) {
        console.log('   ✅ Member can only see themselves (Strict Privacy)')
    } else if (orgAData && orgAData.length > 1) {
        console.log('   ℹ️  Member can see other members in same org (Open Directory)')
    }

    // 3. Cleanup involves deleting the test user
    console.log('\n3️⃣  Cleanup')
    await supabaseAdmin.auth.admin.deleteUser(testUser.id)
    // Org A and B cleanup? Maybe keep for next tests.
    console.log('   Deleted test user')

    console.log('\n✅ Security Audit Complete')
}

runSecurityTest().catch(console.error)
