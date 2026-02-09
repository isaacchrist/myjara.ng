'use client'

import { createContext, useContext, ReactNode } from 'react'

type Store = {
    id: string
    name: string
    slug: string
    shop_type?: string
    status?: string
    role?: string
    [key: string]: any
}

interface SellerStoreContextType {
    store: Store
}

const SellerStoreContext = createContext<SellerStoreContextType | undefined>(undefined)

export function SellerStoreProvider({
    children,
    store,
}: {
    children: ReactNode
    store: Store
}) {
    return (
        <SellerStoreContext.Provider value={{ store }}>
            {children}
        </SellerStoreContext.Provider>
    )
}

export function useSellerStore() {
    const context = useContext(SellerStoreContext)
    if (context === undefined) {
        throw new Error('useSellerStore must be used within a SellerStoreProvider')
    }
    return context
}
