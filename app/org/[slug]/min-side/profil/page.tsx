import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProfileForm from './EditProfileForm'

export default async function MinSideProfilePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return null

    // Get organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    // Fetch linked member profile
    const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('email', user.email)
        .eq('organization_id', organization.id)
        .single()

    if (!member) {
        redirect(`/org/${slug}/min-side`)
    }

    return <EditProfileForm member={member} />
}
