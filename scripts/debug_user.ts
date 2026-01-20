
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ejainxwtvwmlcrbanpeg.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYWlueHd0dndtbGNyYmFucGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNDg1NCwiZXhwIjoyMDg0MTEwODU0fQ.6BqhlBgYtldQ2xrc96hcjgshkDUgilfI0ZlYtINJP4U"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function debugUser() {
    console.log("Searching for user by email...")
    const { data: users, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error("Error listing users:", error)
        return
    }

    const email = "stigmagnebrekken@gmail.com"
    const user = users.users.find(u => u.email === email)

    if (user) {
        console.log(`Found user! ID: ${user.id}`)
        console.log(`(Provided ID was: 5771001a-2bc2-459a-9279-7f053d564db5)`)
        if (user.id === "5771001a-2bc2-459a-9279-7f053d564db5") {
            console.log("IDs match.")
        } else {
            console.log("IDs DO NOT match.")
        }
    } else {
        console.log(`User with email ${email} not found.`)
    }
}

debugUser()
