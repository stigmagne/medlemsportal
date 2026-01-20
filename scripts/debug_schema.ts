
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

async function checkColumns() {
    console.log('Checking columns for "members" table...')

    // We can just fetch one row and print the keys to see clear column names
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching members:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]))
    } else {
        console.log('No members found, so cannot deduce columns from data. Trying to insert dummy to see error?')
    }
}

checkColumns().catch(console.error)
