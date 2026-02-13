"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

type Store = {
    id: string
    name: string
    slug: string
}

type StoreSwitcherProps = {
    items: Store[]
    className?: string
    currentStoreId?: string
    shopType?: string
}

export default function StoreSwitcher({
    items = [],
    className,
    currentStoreId,
    shopType
}: StoreSwitcherProps) {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const formattedItems = items.map((item) => ({
        label: item.name,
        value: item.id,
        slug: item.slug
    }))

    const currentStore = formattedItems.find((item) => item.value === currentStoreId)

    const onStoreSelect = async (store: { value: string, slug: string, label: string }) => {
        setOpen(false)

        // Set cookie for active store
        document.cookie = `myjara_active_store=${store.value}; path=/; max-age=31536000; SameSite=Lax`

        toast({
            title: "Store Switched",
            description: `Switched to ${store.label}`,
        })

        // Refresh to apply new store context
        router.refresh()
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a store"
                    className={cn("w-[200px] justify-between", className)}
                >
                    <Store className="mr-2 h-4 w-4" />
                    {currentStore?.label || "Select a store"}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Stores</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {formattedItems.map((store) => (
                        <DropdownMenuItem
                            key={store.value}
                            onSelect={() => onStoreSelect(store)}
                            className="text-sm cursor-pointer"
                        >
                            <Store className="mr-2 h-4 w-4" />
                            {store.label}
                            <Check
                                className={cn(
                                    "ml-auto h-4 w-4",
                                    currentStore?.value === store.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                )}
                            />
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
                {shopType !== 'market_day' && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-emerald-600 font-medium"
                            onSelect={() => {
                                setOpen(false)
                                router.push("/onboarding/store")
                            }}
                        >
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create Store
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
