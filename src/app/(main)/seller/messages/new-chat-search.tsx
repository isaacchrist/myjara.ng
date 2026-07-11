'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerSearch } from '@/components/chat/customer-search'
import { getOrCreateChatRoomWithCustomerAction } from '@/app/actions/chat'

export function NewCustomerChatSearch({ storeId, excludeIds }: { storeId: string; excludeIds: string[] }) {
    const [isStarting, setIsStarting] = useState(false)
    const router = useRouter()

    const handleSelect = async (userId: string) => {
        setIsStarting(true)
        const result = await getOrCreateChatRoomWithCustomerAction(storeId, userId)
        if ('data' in result && result.data) {
            router.push(`/seller/messages/${result.data.id}`)
        }
        setIsStarting(false)
    }

    return <CustomerSearch onSelect={handleSelect} excludeIds={excludeIds} isStarting={isStarting} />
}
