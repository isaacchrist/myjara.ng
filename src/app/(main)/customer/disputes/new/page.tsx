import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DisputeForm } from '@/components/customer/dispute-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewDisputePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/customer/disputes">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Disputes
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Open a Dispute</h1>
            </div>

            <DisputeForm userId={user.id} />
        </div>
    )
}
