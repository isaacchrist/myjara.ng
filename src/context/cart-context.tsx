"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export interface CartItem {
    id: string // productId
    name: string
    price: number
    quantity: number
    storeId: string
    storeName: string
    image?: string
    // Jara Data
    jaraBuyQty?: number
    jaraGetQty?: number
    maxJara?: number // Just in case we limit it? Not needed for now.
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    count: number
    total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [mounted, setMounted] = useState(false)
    const { toast } = useToast()

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem("myjara-cart")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setItems(parsed)
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }
        setMounted(true)
    }, [])

    // Save to LocalStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("myjara-cart", JSON.stringify(items))
        }
    }, [items, mounted])

    const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === newItem.id)
            if (existing) {
                toast({ title: "Updated Cart", description: `Added more ${newItem.name}` })
                return prev.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + (newItem.quantity || 1) } : i)
            }
            toast({ title: "Added to Cart", description: `${newItem.name} added to your bag` })
            return [...prev, { ...newItem, quantity: newItem.quantity || 1 }]
        })
    }

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(i => i.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId)
            return
        }
        setItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i))
    }

    const clearCart = () => {
        setItems([])
        localStorage.removeItem("myjara-cart")
    }

    const count = items.reduce((acc, item) => acc + item.quantity, 0)
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, count, total }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
