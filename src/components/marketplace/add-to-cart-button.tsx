"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Check } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps {
    product: any
    className?: string
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
    showIcon?: boolean
}

export function AddToCartButton({ product, className, variant = "default", size = "default", showIcon = true }: AddToCartButtonProps) {
    const { addItem } = useCart()
    const [isAdded, setIsAdded] = useState(false)

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            storeId: product.store_id,
            storeName: product.store.name,
            image: product.product_images?.find((img: any) => img.is_primary)?.url || product.product_images?.[0]?.url,
            jaraBuyQty: product.jara_buy_quantity,
            jaraGetQty: product.jara_get_quantity
        })

        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    return (
        <Button
            variant={variant}
            size={size}
            className={cn("transition-all duration-300", className)}
            onClick={handleAddToCart}
            disabled={isAdded}
        >
            {isAdded ? (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Added
                </>
            ) : (
                <>
                    {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
                    Add into Cart
                </>
            )}
        </Button>
    )
}
