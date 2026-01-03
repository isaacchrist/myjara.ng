"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, MapPin, Truck, Loader2, X } from "lucide-react"
import { formatPrice } from "@/lib/utils"

export default function LogisticsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [storeId, setStoreId] = useState<string | null>(null)
    const [logistics, setLogistics] = useState<any[]>([])
    const [showAddForm, setShowAddForm] = useState(false)

    const [formData, setFormData] = useState({
        type: "pickup" as "pickup" | "delivery",
        location_name: "",
        city: "",
        delivery_fee: "0",
        delivery_timeline: "",
    })

    const supabase = createClient()
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        const fetchLogistics = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push("/login")
                    return
                }

                const { data: store, error: storeError } = await supabase
                    .from("stores")
                    .select("id")
                    .eq("owner_id", user.id)
                    .single() as any

                if (storeError) throw storeError
                setStoreId(store.id)

                const { data: logisticsData, error: logError } = await supabase
                    .from("store_logistics")
                    .select("*")
                    .eq("store_id", store.id)
                    .order("created_at", { ascending: false })

                if (logError) throw logError
                setLogistics(logisticsData || [])

            } catch (error: any) {
                console.error("Error fetching logistics:", error)
                toast({
                    title: "Error",
                    description: "Failed to load logistics settings",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchLogistics()
    }, [supabase, router, toast])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeId) return

        setIsSaving(true)
        try {
            const { data, error } = await (supabase
                .from("store_logistics") as any)
                .insert({
                    store_id: storeId,
                    type: formData.type,
                    location_name: formData.location_name,
                    city: formData.city,
                    delivery_fee: parseFloat(formData.delivery_fee),
                    delivery_timeline: formData.delivery_timeline,
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error

            setLogistics([data, ...logistics])
            setShowAddForm(false)
            setFormData({
                type: "pickup",
                location_name: "",
                city: "",
                delivery_fee: "0",
                delivery_timeline: "",
            })

            toast({
                title: "Success",
                description: "Logistics option added successfully"
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add logistics option",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this option?")) return

        try {
            const { error } = await supabase
                .from("store_logistics")
                .delete()
                .eq("id", id)

            if (error) throw error

            setLogistics(logistics.filter(l => l.id !== id))
            toast({
                title: "Deleted",
                description: "Logistics option removed"
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete",
                variant: "destructive"
            })
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Logistics Management</h1>
                    <p className="text-gray-500">Manage your pickup points and delivery zones</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "outline" : "default"}>
                    {showAddForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {showAddForm ? "Cancel" : "Add New Option"}
                </Button>
            </div>

            {showAddForm && (
                <Card className="border-emerald-100 bg-emerald-50/30">
                    <CardHeader>
                        <CardTitle>Add Logistics Option</CardTitle>
                        <CardDescription>Create a new pickup location or delivery service</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="pickup">Pickup Point</option>
                                        <option value="delivery">Delivery Service</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">City</label>
                                    <Input
                                        placeholder="e.g. Lagos, Abuja"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {formData.type === 'pickup' ? 'Location Name / Address' : 'Service Name / Zone'}
                                </label>
                                <Input
                                    placeholder={formData.type === 'pickup' ? "e.g. Ikeja Warehouse, 123 Allen Ave" : "e.g. Lagos Mainland Delivery"}
                                    value={formData.location_name}
                                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fee (₦)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.delivery_fee}
                                        onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Timeline</label>
                                    <Input
                                        placeholder="e.g. Same day, 1-2 days"
                                        value={formData.delivery_timeline}
                                        onChange={(e) => setFormData({ ...formData, delivery_timeline: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Logistics Option"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {logistics.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Truck className="mb-4 h-12 w-12 opacity-20" />
                            <p>No logistics options configured yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    logistics.map((option) => (
                        <Card key={option.id} className="overflow-hidden">
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${option.type === 'pickup' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {option.type === 'pickup' ? <MapPin className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">{option.location_name}</h3>
                                            <Badge variant="secondary" className="capitalize">
                                                {option.type}
                                            </Badge>
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                            <span>{option.city}</span>
                                            <span>•</span>
                                            <span>{option.delivery_timeline}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            {option.delivery_fee === 0 ? 'FREE' : formatPrice(option.delivery_fee)}
                                        </p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                            {option.type === 'pickup' ? 'Pickup Fee' : 'Delivery Fee'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-red-600"
                                        onClick={() => handleDelete(option.id)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
