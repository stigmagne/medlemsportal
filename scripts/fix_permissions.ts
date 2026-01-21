
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing environment variables")
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const TARGET_USER_ID = "5771001a-2bc2-459a-9279-7f053d564db5"
const TARGET_ORG_SLUG = "test-forening"

async function main() {
    console.log("Starting permission fix...")

    // 1. Get Org ID
    const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", TARGET_ORG_SLUG)
        .single()

    if (orgError || !org) {
        console.error("Could not find organization:", TARGET_ORG_SLUG)
        return
    }
    console.log(`Found org '${TARGET_ORG_SLUG}' with ID: ${org.id}`)

    // 2. Grant Admin Role for Org
    const { error: adminError } = await supabase
        .from("user_org_access")
        .upsert({
            user_id: TARGET_USER_ID,
            organization_id: org.id,
            role: "admin"
        }, { onConflict: "user_id, organization_id" })

    if (adminError) {
        console.error("Error granting admin role:", adminError)
    } else {
        console.log("✅ Granted 'admin' role for 'test-forening'")
    }

    // 3. Grant Superadmin Role (System level, org_id = null)
    const { error: superError } = await supabase
        .from("user_org_access")
        .upsert({
            user_id: TARGET_USER_ID,
            organization_id: null,
            role: "superadmin"
        }, { onConflict: "user_id, organization_id" }) // NOTE: Constraint needs to support null. 
    // If unique index doesn't handle nulls as unique pairs in postgres standard way (it does distinct them), 
    // but often 'null' is tricky.
    // Let's check if we can query first to be safe, or just try insert.

    if (superError) {
        console.error("Error granting superadmin role:", superError)
    } else {
        console.log("✅ Granted 'superadmin' role (system level)")
    }

    console.log("Done.")
}

main()
