
import { createClient } from "@supabase/supabase-js"
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const NEXT_PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing environment variables")
    process.exit(1)
}

// Test using SERVICE ROLE first (bypass RLS) to see what is there
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test using ANON KEY (respect RLS) - but we need to sign in technically to mimic user.
// But we can't easily sign in with password in script if we don't know it.
// We can just check policies via admin client if possible (by querying pg_policies).

async function main() {
    console.log("Checking user_org_access table...")

    // 1. Dump all rows for our user (Admin Role)
    const TARGET_USER_ID = "b24defba-8b6e-45e9-8bfa-089ddf00e464"

    const { data: access, error } = await adminClient
        .from("user_org_access")
        .select("*")
        .eq("user_id", TARGET_USER_ID)

    if (error) {
        console.error("Error fetching access items:", error)
    } else {
        console.log("Found access items (Service Role):", access)
    }

    // 2. Check if table has RLS enabled
    // We can query pg_tables or pg_class but easier to just check if we can query it via anon client? No, anon needs auth.
    // Let's query policies.

    // We can run raw SQL via the fix_permissions hack if needed, but let's just use what we have.
    // I suspect the issue is simply that `user_org_access` might not have a policy allowing users to read THEIR OWN rows,
    // OR the policy assumes 'admin' role but we changed it to 'org_admin'.

    // If the policy on `user_org_access` says: 
    // "Users can read own rows" -> `user_id = auth.uid()`
    // Then it should be fine.

    // But if it says:
    // "Admins can read all rows" -> `role = 'admin'`
    // And we changed user to `org_admin`.
    // Then that policy might fail if it hardcoded 'admin'.

    // I strongly suspect this is the case.

    // Strategy: Just blindly add a policy ensuring users can read their own rows in `user_org_access`.
    // And also ensure 'org_admin' and 'superadmin' are covered if necessary.
}

main()
