import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSubscriptionExpiryReminderEmail } from '@/lib/resend'
import { createNotification } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

// Triggered daily by Vercel Cron (see vercel.json). Reminds a store owner at
// 3 days before expiry, 1 day before, and on the day it expires -- picking
// those three exact offsets (rather than "any day <= 3 left") means a daily
// run naturally sends each reminder once, with no extra "already notified"
// column needed.
const REMINDER_DAY_OFFSETS = [3, 1, 0]

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000

    // Window covers the furthest offset (3 days) so we only scan stores that
    // could plausibly match one of the exact offsets below.
    const windowEnd = new Date(now.getTime() + REMINDER_DAY_OFFSETS[0] * msPerDay + msPerDay)

    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, owner_id, subscription_expiry, owner:users!owner_id(email, full_name, role)')
        .not('subscription_expiry', 'is', null)
        .lte('subscription_expiry', windowEnd.toISOString())
        .gte('subscription_expiry', now.toISOString()) as any

    if (error) {
        console.error('Subscription reminder query error:', error)
        return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    let sent = 0

    for (const store of stores || []) {
        const expiry = new Date(store.subscription_expiry)
        const daysLeft = Math.round((expiry.getTime() - now.getTime()) / msPerDay)

        if (!REMINDER_DAY_OFFSETS.includes(daysLeft)) continue
        if (!store.owner?.email) continue

        const expiryDateLabel = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        const subscriptionLink = store.owner.role === 'retailer' ? '/seller/subscription' : '/dashboard/subscription'

        await sendSubscriptionExpiryReminderEmail({
            email: store.owner.email,
            fullName: store.owner.full_name || 'Partner',
            storeName: store.name,
            daysLeft,
            expiryDate: expiryDateLabel,
            actionLink: `https://myjara.com.ng${subscriptionLink}`,
        })

        await createNotification({
            userId: store.owner_id,
            type: 'subscription',
            title: daysLeft === 0
                ? 'Your subscription expires today'
                : `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
            body: `Renew before ${expiryDateLabel} to avoid any interruption to ${store.name}.`,
            link: subscriptionLink,
        })

        sent++
    }

    return NextResponse.json({ success: true, checked: stores?.length || 0, sent })
}
