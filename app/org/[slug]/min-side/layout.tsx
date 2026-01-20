import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MinSideLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', slug)
        .single()

    if (!organization) {
        redirect('/')
    }

    // Verify user is a member of this organization
    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('email', user.email)
        .is('deleted_at', null)
        .single()

    if (!member) {
        // Logged in but not a member of this specific org -> redirect to portal
        redirect('/min-side')
    }

    const orgName = organization.name

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href={`/org/${slug}/min-side`} className="text-xl font-bold text-gray-900 dark:text-white">
                                    Min Side - {orgName}
                                </Link>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href={`/org/${slug}/min-side`}
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Oversikt
                                </Link>
                                <Link
                                    href={`/org/${slug}/min-side/profil`}
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Min Profil
                                </Link>
                                <Link
                                    href={`/org/${slug}/min-side/dugnad`}
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Dugnad
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/min-side"
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                                Bytt forening
                            </Link>
                            <div className="flex-shrink-0">
                                <form action="/auth/signout" method="post">
                                    <button
                                        type="submit"
                                        className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Logg ut
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
