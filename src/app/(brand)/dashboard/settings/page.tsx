"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Save, Upload, X } from "lucide-react"
import Image from "next/image"

export default function BrandSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [storeId, setStoreId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        logo_url: "",
        settings: {
            theme: {
                primaryColor: "#10b981", // Default emerald-500
                layout: "grid" // Default grid
            }
        }
    })

    const supabase = createClient()
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push("/login")
                    return
                }

                const { data: store, error } = await supabase
                    .from("stores")
                    .select("*")
                    .eq("owner_id", user.id)
                    .single() as any

                if (error) throw error

                setStoreId(store.id)
                setFormData({
                    name: store.name,
                    slug: store.slug,
                    description: store.description || "",
                    logo_url: store.logo_url || "",
                    settings: (store.settings as any) || {
                        theme: {
                            primaryColor: "#10b981",
                            layout: "grid"
                        }
                    }
                })
            } catch (error) {
                console.error("Error fetching store:", error)
                toast({
                    title: "Error",
                    description: "Failed to load store settings.",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchStore()
    }, [router, supabase, toast])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeId) return

        try {
            setIsSaving(true)
            const { error } = await (supabase
                .from("stores") as any)
                .update({
                    name: formData.name,
                    description: formData.description,
                    logo_url: formData.logo_url,
                    settings: formData.settings
                })
                .eq("id", storeId)

            if (error) throw error

            toast({
                title: "Success",
                description: "Store settings updated successfully."
            })
        } catch (error) {
            console.error("Error updating store:", error)
            toast({
                title: "Error",
                description: "Failed to update settings.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center">Loading settings...</div>
    }

    return (
        <div className="container mx-auto max-w-4xl p-6">
            <h1 className="mb-8 text-3xl font-bold">Store Settings</h1>

            <form onSubmit={handleSave} className="space-y-6">
                {/* General Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                        <CardDescription>Update your store's basic details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Store Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Store URL</Label>
                            <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                myjara.com/store/
                                <span className="font-medium text-gray-900">{formData.slug}</span>
                            </div>
                            <p className="text-xs text-gray-500">Contact support to change your store URL.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="logo">Store Logo</Label>
                            <div className="flex flex-col gap-3">
                                {formData.logo_url && (
                                    <div className="relative inline-block w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                                        <Image
                                            src={formData.logo_url}
                                            alt="Store logo"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, logo_url: "" })}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        id="logo"
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file || !storeId) return

                                            try {
                                                setIsUploading(true)
                                                const fileExt = file.name.split(".").pop()
                                                const filePath = `${storeId}/logo.${fileExt}`

                                                const { error: uploadError, data } = await supabase.storage
                                                    .from("store-assets")
                                                    .upload(filePath, file, { upsert: true })

                                                if (uploadError) throw uploadError

                                                const { data: { publicUrl } } = supabase.storage
                                                    .from("store-assets")
                                                    .getPublicUrl(filePath)

                                                setFormData({ ...formData, logo_url: publicUrl })
                                                toast({
                                                    title: "Success",
                                                    description: "Logo uploaded successfully."
                                                })
                                            } catch (error) {
                                                console.error("Error uploading logo:", error)
                                                toast({
                                                    title: "Error",
                                                    description: "Failed to upload logo.",
                                                    variant: "destructive"
                                                })
                                            } finally {
                                                setIsUploading(false)
                                            }
                                        }}
                                        disabled={isUploading}
                                        className="flex-1"
                                    />
                                    {isUploading && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Upload className="mr-2 h-4 w-4 animate-bounce" />
                                            Uploading...
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">Recommended: Square image, at least 200x200px</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance & Customization</CardTitle>
                        <CardDescription>Customize how your store looks to customers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Color Theme */}
                        <div className="space-y-3">
                            <Label>Brand Color</Label>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { name: "Emerald", value: "#10b981" },
                                    { name: "Blue", value: "#3b82f6" },
                                    { name: "Purple", value: "#8b5cf6" },
                                    { name: "Rose", value: "#f43f5e" },
                                    { name: "Amber", value: "#f59e0b" },
                                    { name: "Black", value: "#171717" },
                                ].map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            settings: {
                                                ...formData.settings,
                                                theme: { ...formData.settings.theme, primaryColor: color.value }
                                            }
                                        })}
                                        className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${formData.settings.theme.primaryColor === color.value
                                            ? "border-gray-900 ring-2 ring-gray-200 ring-offset-2"
                                            : "border-transparent"
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Layout Options */}
                        <div className="space-y-3">
                            <Label>Product Layout</Label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: "grid", name: "Grid View", icon: "⊞" },
                                    { id: "list", name: "List View", icon: "≣" },
                                    { id: "featured", name: "Featured", icon: "★" },
                                ].map((layout) => (
                                    <button
                                        key={layout.id}
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            settings: {
                                                ...formData.settings,
                                                theme: { ...formData.settings.theme, layout: layout.id }
                                            }
                                        })}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:bg-gray-50 ${formData.settings.theme.layout === layout.id
                                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                            : "border-gray-200 text-gray-600"
                                            }`}
                                    >
                                        <span className="text-2xl">{layout.icon}</span>
                                        <span className="mt-2 text-sm font-medium">{layout.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
