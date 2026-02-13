import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SellerSidebar } from '@/components/seller/sidebar'
import { getActiveStore } from '@/lib/store-context'
import { SellerStoreProvider } from '@/context/seller-store-context'

export default async function SellerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Use our helper to get stores and active store
    const storeData = await getActiveStore()

    // If no store found, redirect to onboarding (unless already there, but this layout is for /seller)
    // /onboarding/store is outside this layout usually.
    if (!storeData || storeData.stores.length === 0) {
        redirect('/onboarding/store')
    }

    const { activeStore, stores } = storeData

    // Fetch unread messages count for badge
    const { count: unreadCount } = await supabase
        .from('messages')
        .select('chat_rooms!inner(store_id)', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id) // Messages sent by others
        .eq('chat_rooms.store_id', activeStore.id)

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            <div className="hidden border-r md:block">
                <SellerSidebar
                    stores={stores}
                    activeStoreId={activeStore.id}
                    shopType={activeStore.shop_type}
                    unreadCount={unreadCount || 0}
                />
            </div>
            <main className="flex-1 w-full">
                {/* Dynamically import Provider if needed, but it's small */}
                {/* We need to import it at top too */}
                <SellerStoreProvider store={activeStore}>
                    {children}
                </SellerStoreProvider>
            </main>
        </div>
    )
}
