
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

const SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function generateMegaOrg() {
    console.log('🚀 Starting Performance Data Generation: "Mega-foreningen"\n')

    // 1. Create Mega Org
    let { data: org } = await supabaseAdmin.from('organizations').select('id, slug').eq('slug', 'mega-foreningen').single()
    if (!org) {
        const { data, error } = await supabaseAdmin.from('organizations').insert({
            name: 'Mega Foreningen IL (Perf Test)',
            slug: 'mega-foreningen'
        }).select().single()
        if (error) throw error
        org = data
        console.log('   Created Mega Foreningen')
    } else {
        console.log('   Using existing Mega Foreningen')
    }

    // Explicit null check
    if (!org) {
        console.error('Failed to retrieve or create organization')
        return
    }

    // 2. Generate 2000 members
    const TARGET_COUNT = 2000
    const BATCH_SIZE = 100

    // Check current count
    const { count } = await supabaseAdmin.from('members').select('*', { count: 'exact', head: true }).eq('organization_id', org.id)
    console.log(`   Current member count: ${count}`)

    if ((count || 0) >= TARGET_COUNT) {
        console.log('   ✅ Target count reached. Skipping generation.')
        return
    }

    const needed = TARGET_COUNT - (count || 0)
    console.log(`   Generating ${needed} members in batches of ${BATCH_SIZE}...`)

    for (let i = 0; i < needed; i += BATCH_SIZE) {
        const batch = []
        for (let j = 0; j < BATCH_SIZE && (i + j) < needed; j++) {
            const id = i + j + (count || 0)
            const firstName = ['Ola', 'Kari', 'Per', 'Pål', 'Espen', 'Line', 'Hanne'].sort(() => 0.5 - Math.random())[0]
            const lastName = ['Hansen', 'Olsen', 'Nilsen', 'Berg', 'Haugen', 'Hagen'].sort(() => 0.5 - Math.random())[0]

            batch.push({
                organization_id: org.id,
                first_name: `${firstName}_${id}`,
                last_name: `${lastName}`,
                email: `user_${id}_${Date.now()}@mega.example.com`,
                member_number: `MEGA-${id}`,
                status: 'active'
            })
        }

        const { error } = await supabaseAdmin.from('members').insert(batch)
        if (error) {
            console.error('Error in batch:', error)
            break
        }
        process.stdout.write('.')
    }

    console.log('\n   ✅ Generation complete!')
    console.log(`   Visit: /org/mega-foreningen/medlemmer to stress test.`)
}

generateMegaOrg().catch(console.error)
