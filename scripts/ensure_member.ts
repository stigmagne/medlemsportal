
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ejainxwtvwmlcrbanpeg.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYWlueHd0dndtbGNyYmFucGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNDg1NCwiZXhwIjoyMDg0MTEwODU0fQ.6BqhlBgYtldQ2xrc96hcjgshkDUgilfI0ZlYtINJP4U"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const TARGET_EMAIL = "stigmagnebrekken@gmail.com"
const TARGET_ORG_SLUG = "test-forening"

async function main() {
    console.log(`Checking membership for ${TARGET_EMAIL} in ${TARGET_ORG_SLUG}...`)

    // 1. Get Org ID
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", TARGET_ORG_SLUG)
        .single()

    if (!org) {
        console.error("Org not found")
        return
    }

    // 2. Check Member
    const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("email", TARGET_EMAIL)
        .eq("organization_id", org.id)
        .single()

    if (member) {
        console.log("Member FOUND:", member)
    } else {
        console.log("Member NOT found. Creating...")

        const { error } = await supabase
            .from("members")
            .insert({
                organization_id: org.id,
                first_name: "Stig",
                last_name: "Brekken",
                email: TARGET_EMAIL,
                status: "active",
                joined_date: new Date().toISOString(),
                // Add default member type if needed?
                // Usually member_type_id is optional or handled by default.
            })

        if (error) {
            console.error("Error creating member:", error)
        } else {
            console.log("✅ Member created successfully.")
        }
    }
}

main()
