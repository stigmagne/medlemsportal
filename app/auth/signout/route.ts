
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    // Sign out
    await supabase.auth.signOut()

    // Revalidate root layout
    revalidatePath('/', 'layout')

    // Redirect to home/login
    return redirect('/')
}
