import { getAdminSession } from '@/app/actions/admin-auth'
import { redirect } from 'next/navigation'
import VerificationQueueClient from './verification-queue-client'

export default async function GlobalAdminDashboard() {
    const isAdmin = await getAdminSession()

    if (!isAdmin) {
        redirect('/admin')
    }

    return <VerificationQueueClient />
}
