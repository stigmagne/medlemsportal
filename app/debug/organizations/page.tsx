import { createClient } from '@/lib/supabase/server'

export default async function DebugOrganizationsPage() {
    const supabase = await createClient()

    const { data: organizations, error } = await supabase
        .from('organizations')
        .select('id, name, slug, created_at')
        .order('created_at', { ascending: false })

    if (error) {
        return <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Database Error</h1>
            <pre className="bg-red-50 p-4 rounded">{JSON.stringify(error, null, 2)}</pre>
        </div>
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Organizations in Database</h1>
            <p className="mb-4">Total: {organizations?.length || 0}</p>
            <div className="space-y-4">
                {organizations?.map((org) => (
                    <div key={org.id} className="bg-gray-50 p-4 rounded border">
                        <div><strong>Name:</strong> {org.name}</div>
                        <div><strong>Slug:</strong> {org.slug}</div>
                        <div><strong>ID:</strong> {org.id}</div>
                        <div><strong>URL:</strong> <a href={`/org/${org.slug}/dashboard`} className="text-blue-600 hover:underline">/org/{org.slug}/dashboard</a></div>
                    </div>
                ))}
            </div>
        </div>
    )
}
