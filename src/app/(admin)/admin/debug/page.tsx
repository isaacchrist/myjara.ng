import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
    const supabase = await createAdminClient()

    // Fetch last 5 auth users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 5
    })

    // Fetch last 5 public users
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch last 5 stores
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Registration Debugger</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">1. Auth Users (Last 5)</h2>
                {authError ? (
                    <div className="text-red-500">Error: {authError.message}</div>
                ) : (
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-60">
                        {JSON.stringify(authUsers, null, 2)}
                    </pre>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">2. Public Users (Last 5)</h2>
                {publicError ? (
                    <div className="text-red-500">Error: {publicError.message}</div>
                ) : (
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-60">
                        {JSON.stringify(publicUsers, null, 2)}
                    </pre>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">3. Stores (Last 5)</h2>
                {storesError ? (
                    <div className="text-red-500">Error: {storesError.message}</div>
                ) : (
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-60">
                        {JSON.stringify(stores, null, 2)}
                    </pre>
                )}
            </section>
        </div>
    )
}
