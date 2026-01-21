
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
    console.log('Checking columns for "email_logs" ...')
    const { data: emailData } = await supabase.from('email_logs').select('*').limit(1)
    if (emailData && emailData.length > 0) {
        console.log('email_logs columns:', Object.keys(emailData[0]))
    } else {
        console.log('No data in email_logs')
    }

    console.log('Checking columns for "membership_fees" ...')
    const { data: feeData } = await supabase.from('membership_fees').select('*').limit(1)
    if (feeData && feeData.length > 0) {
        console.log('membership_fees columns:', Object.keys(feeData[0]))
    } else {
        console.log('No data in membership_fees')
    }
}

checkColumns().catch(console.error)
