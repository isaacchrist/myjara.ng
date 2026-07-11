"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, Package, Flag, X } from "lucide-react"
import { getMessagesAction, sendMessageAction, markMessagesReadAction, getStoreProductsForChatAction } from "@/app/actions/chat"
import { flagChatAsDisputeAction } from "@/app/actions/disputes"
import { formatDistanceToNow } from "date-fns"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface ChatWindowProps {
    roomId: string
    currentUserId: string
    recipientName: string
    storeId?: string
    className?: string
}

function ProductBubble({ product, isMe }: { product: any; isMe: boolean }) {
    if (!product) return null
    const image = product.product_images?.find((i: any) => i.is_primary)?.url || product.product_images?.[0]?.url

    return (
        <Link
            href={`/product/${product.id}`}
            target="_blank"
            className={`flex items-center gap-3 rounded-xl border p-2 max-w-[75%] transition-colors ${isMe ? 'bg-emerald-700/40 border-emerald-500/40 hover:bg-emerald-700/60' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
        >
            <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                {image ? (
                    <Image src={image} alt={product.name} fill className="object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300">
                        <Package className="h-5 w-5" />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                <p className={`text-xs ${isMe ? 'text-emerald-100' : 'text-gray-500'}`}>{formatPrice(product.price)}</p>
            </div>
        </Link>
    )
}

export function ChatWindow({ roomId, currentUserId, recipientName, storeId, className }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [showProductPicker, setShowProductPicker] = useState(false)
    const [storeProducts, setStoreProducts] = useState<any[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [showFlagForm, setShowFlagForm] = useState(false)
    const [flagReason, setFlagReason] = useState("")
    const [flagDescription, setFlagDescription] = useState("")
    const [flagging, setFlagging] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // 1. Initial Fetch
    useEffect(() => {
        const fetchMessages = async () => {
            const data = await getMessagesAction(roomId)
            setMessages(data || [])
            setIsLoading(false)
            markMessagesReadAction(roomId)
        }
        fetchMessages()
    }, [roomId])

    // 2. Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel(`chat:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const newMsg = payload.new
                    setMessages((prev) => [...prev, newMsg])
                    if (newMsg.sender_id !== currentUserId) {
                        markMessagesReadAction(roomId)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, currentUserId, supabase])

    // 3. Auto Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() || isSending) return

        const content = newMessage
        setNewMessage("") // Optimistic clear
        setIsSending(true)

        const result = await sendMessageAction(roomId, content)
        if (result.error) {
            console.error("Failed to send")
        }

        setIsSending(false)
    }

    const handleOpenProductPicker = async () => {
        setShowProductPicker(true)
        if (!storeId || storeProducts.length > 0) return
        setLoadingProducts(true)
        const products = await getStoreProductsForChatAction(storeId)
        setStoreProducts(products)
        setLoadingProducts(false)
    }

    const handleAttachProduct = async (product: any) => {
        setShowProductPicker(false)
        setIsSending(true)
        const result = await sendMessageAction(roomId, `📦 ${product.name}`, product.id)
        if (result.error) {
            toast.error('Failed to share product')
        }
        setIsSending(false)
    }

    const handleFlagDispute = async () => {
        if (!flagReason.trim()) {
            toast.error('Give a short reason for the flag')
            return
        }
        setFlagging(true)
        const result = await flagChatAsDisputeAction(roomId, flagReason.trim(), flagDescription.trim())
        setFlagging(false)
        if (result.success) {
            toast.success('Conversation flagged for admin review')
            setShowFlagForm(false)
            setFlagReason("")
            setFlagDescription("")
        } else {
            toast.error(result.error || 'Failed to flag conversation')
        }
    }

    return (
        <div className={`flex flex-col h-full bg-white ${className}`}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                <div>
                    <h3 className="font-bold text-gray-900">{recipientName}</h3>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="block h-2 w-2 rounded-full bg-green-500"></span>
                        Online
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => setShowFlagForm((v) => !v)}
                >
                    <Flag className="h-4 w-4 mr-1" /> Flag
                </Button>
            </div>

            {showFlagForm && (
                <div className="p-4 border-b bg-red-50 space-y-2">
                    <Input
                        placeholder="Reason (e.g. Payment dispute, Item not as described)"
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        className="bg-white"
                    />
                    <Textarea
                        placeholder="Add any details for the admin reviewing this (optional)"
                        value={flagDescription}
                        onChange={(e) => setFlagDescription(e.target.value)}
                        className="bg-white"
                        rows={2}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowFlagForm(false)}>
                            Cancel
                        </Button>
                        <Button type="button" size="sm" className="bg-red-600 hover:bg-red-700" disabled={flagging} onClick={handleFlagDispute}>
                            {flagging ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Flag className="h-4 w-4 mr-1" />}
                            Submit to Admin
                        </Button>
                    </div>
                </div>
            )}

            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-gray-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender_id === currentUserId
                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    {msg.product ? (
                                        <ProductBubble product={msg.product} isMe={isMe} />
                                    ) : (
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                                ? 'bg-emerald-600 text-white rounded-br-none'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-400 px-1">
                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            )
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {showProductPicker && (
                <div className="border-t bg-gray-50 max-h-56 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-white sticky top-0">
                        <span className="text-xs font-medium text-gray-500">Share a product</span>
                        <button type="button" onClick={() => setShowProductPicker(false)} className="text-gray-400 hover:text-gray-700">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {loadingProducts ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-gray-400 h-4 w-4" />
                        </div>
                    ) : storeProducts.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-4">No products found</p>
                    ) : (
                        <div className="divide-y">
                            {storeProducts.map((p) => {
                                const image = p.product_images?.find((i: any) => i.is_primary)?.url || p.product_images?.[0]?.url
                                return (
                                    <button
                                        type="button"
                                        key={p.id}
                                        onClick={() => handleAttachProduct(p)}
                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left"
                                    >
                                        <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                                            {image ? (
                                                <Image src={image} alt={p.name} fill className="object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-900 truncate">{p.name}</p>
                                            <p className="text-xs text-gray-500">{formatPrice(p.price)}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex gap-2">
                    {storeId && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={handleOpenProductPicker}
                            title="Share a product"
                        >
                            <Package className="h-4 w-4" />
                        </Button>
                    )}
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-white"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={isSending || !newMessage.trim()}
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    )
}
