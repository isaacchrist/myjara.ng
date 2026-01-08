import { getAdminSession } from '@/app/actions/admin-auth'
import { redirect } from 'next/navigation'
import { AdminKeyForm } from '@/components/admin/admin-key-form'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminLoginPage() {
    const isAdmin = await getAdminSession()

    if (isAdmin) {
        redirect('/admin')
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
            </div>

            <div className="z-10 w-full max-w-md px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-2" style={{ fontFamily: '"Lobster", cursive' }}>
                        MyJara
                    </h1>
                    <p className="text-gray-400">Administrative Access Portal</p>
                </div>

                <AdminKeyForm
                    title="Admin Login"
                    description="Enter your access key to manage the platform."
                />
            </div>
        </div>
    )
}
