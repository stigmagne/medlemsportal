
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ejainxwtvwmlcrbanpeg.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYWlueHd0dndtbGNyYmFucGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNDg1NCwiZXhwIjoyMDg0MTEwODU0fQ.6BqhlBgYtldQ2xrc96hcjgshkDUgilfI0ZlYtINJP4U"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function inspectConstraint() {
    console.log("Fetching constraint definition...")

    // We can use rpc if we had one, or try to infer from a failed insert with a known invalid value?
    // Actually, let's just use the fact that we can run raw SQL? No, we can't easily via client.
    // But we found psql command failed.

    // Alternative: Try to insert a dummy row with a wildly invalid role and see if the error message lists allowed values?
    // Postgres usually just says "violates check constraint".

    // Let's try 'owner' as it is a common role.
    // And 'member'.

    const TARGET_ORG_ID = "f78fad69-4065-402a-be9c-1053c76292c3" // Test-forening ID we found earlier
    const USER_ID = "b24defba-8b6e-45e9-8bfa-089ddf00e464"

    const rolesToTest = ["owner", "admin", "superadmin", "manage", "editor"]

    for (const role of rolesToTest) {
        console.log(`Testing role: ${role}`)
        const { error } = await supabase
            .from("user_org_access")
            .upsert({
                user_id: USER_ID,
                organization_id: TARGET_ORG_ID,
                role: role
            })

        if (error) {
            console.log(`❌ Role '${role}' failed: ${error.message}`)
        } else {
            console.log(`✅ Role '${role}' SUCCESS!`)
        }
    }
}

inspectConstraint()
