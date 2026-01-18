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


    // Fetch Diagnostic Data
    const { data: diagnostic, error: diagError } = await supabase.rpc('diagnose_registration_issues' as any)

    // Fetch Error Logs
    const { data: errorLogs } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Registration Debugger</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2 text-red-600">!! TRIGGER ERRORS !!</h2>
                {!errorLogs || errorLogs.length === 0 ? (
                    <div className="text-gray-500 italic">No errors logged (yet).</div>
                ) : (
                    <div className="space-y-4">
                        {errorLogs.map((log: any) => (
                            <div key={log.id} className="bg-red-50 p-4 rounded border border-red-200">
                                <div className="font-bold text-red-700">{log.error_message}</div>
                                <div className="text-xs text-gray-600 font-mono mt-1">STATE: {log.error_detail}</div>
                                <div className="text-xs text-gray-500 mt-2">Payload:</div>
                                <pre className="text-[10px] overflow-auto max-h-40 bg-white p-2 border">{JSON.stringify(log.payload?.raw_user_meta_data, null, 2)}</pre>
                            </div>
                        ))}
                    </div>
                )}
            </section>


            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">0. Database Diagnostics</h2>
                {diagError ? (
                    <div className="text-red-500">
                        Error running diagnostics: {diagError.message}
                        <br /><span className="text-sm text-gray-500"> Did you run <code>diagnostic_check.sql</code>?</span>
                    </div>
                ) : (
                    <pre className="bg-slate-900 text-green-400 p-4 rounded overflow-auto text-xs max-h-96 font-mono">
                        {JSON.stringify(diagnostic, null, 2)}
                    </pre>
                )}
            </section>

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
