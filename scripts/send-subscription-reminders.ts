
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function sendReminders() {
    console.log('--- Starting Subscription Reminder Job ---')
    const now = new Date()

    // Check for subscriptions expiring in the next 3 days
    // We fetch stores where subscription_expiry is between now and now + 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(now.getDate() + 3)

    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, owner_id, subscription_expiry, subscription_plan')
        .gte('subscription_expiry', now.toISOString())
        .lte('subscription_expiry', threeDaysFromNow.toISOString())

    if (error) {
        console.error('Error fetching stores:', error)
        return
    }

    console.log(`Found ${stores.length} stores expiring soon.`)

    for (const store of stores) {
        // Fetch user email
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(store.owner_id)

        if (userError || !user || !user.email) {
            console.error(`Could not fetch user for store ${store.name}`)
            continue
        }

        const expiryDate = new Date(store.subscription_expiry)
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Simulate Sending Email
        console.log(`
        ---------------------------------------------------
        [EMAIL SIMULATION]
        To: ${user.email}
        Subject: Your MyJara Subscription Expires in ${daysLeft} Days!
        
        Hello ${store.name},
        
        Your ${store.subscription_plan} subscription is set to expire on ${expiryDate.toLocaleDateString()}.
        Please renew now to avoid interruption to your store.
        
        Link: https://myjara.com/seller/subscription
        ---------------------------------------------------
        `)
    }
    console.log('--- Job Completed ---')
}

sendReminders()
