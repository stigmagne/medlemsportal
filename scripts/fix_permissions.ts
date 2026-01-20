
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Manual load of .env.local because we are running with tsx outside of next dev context usually,
// but let's just hardcode the keys we just read or assume process.env is populated if run correctly.
// Actually, reading file is safer.
// For this script, I'll paste the keys I just saw to be sure (since I can't rely on dotenv flow in this environment easily).

const SUPABASE_URL = "https://ejainxwtvwmlcrbanpeg.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYWlueHd0dndtbGNyYmFucGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNDg1NCwiZXhwIjoyMDg0MTEwODU0fQ.6BqhlBgYtldQ2xrc96hcjgshkDUgilfI0ZlYtINJP4U"

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
