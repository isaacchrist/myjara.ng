"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Plus, Pencil, Trash2, Loader2, X, Check, Star } from "lucide-react"
import {
    getStoreLocationsAction,
    addLocationAction,
    updateLocationAction,
    deleteLocationAction,
    setPrimaryLocationAction,
    type StoreLocation,
} from "@/app/actions/locations"

function LocationForm({
    initial,
    onSave,
    onCancel,
}: {
    initial?: Partial<StoreLocation>
    onSave: (values: { name: string; address: string; city: string; phone: string }) => Promise<void>
    onCancel: () => void
}) {
    const [name, setName] = useState(initial?.name || "")
    const [address, setAddress] = useState(initial?.address || "")
    const [city, setCity] = useState(initial?.city || "")
    const [phone, setPhone] = useState(initial?.phone || "")
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) return
        setSaving(true)
        await onSave({ name: name.trim(), address, city, phone })
        setSaving(false)
    }

    return (
        <div className="rounded-lg border p-4 space-y-3 bg-gray-50">
            <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Location name (e.g. Wuse Branch)" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
            </div>
        </div>
    )
}

export function LocationsManager() {
    const [locations, setLocations] = useState<StoreLocation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)
    const { toast } = useToast()

    const load = async () => {
        const result = await getStoreLocationsAction()
        if (result.data) setLocations(result.data)
        setIsLoading(false)
    }

    useEffect(() => {
        load()
    }, [])

    const handleAdd = async (values: { name: string; address: string; city: string; phone: string }) => {
        const result = await addLocationAction(values)
        if (!result.success) {
            toast({ title: "Could not add location", description: result.error, variant: "destructive" })
            return
        }
        toast({ title: "Location added" })
        setAdding(false)
        load()
    }

    const handleUpdate = async (id: string, values: { name: string; address: string; city: string; phone: string }) => {
        const result = await updateLocationAction(id, values)
        if (!result.success) {
            toast({ title: "Could not update location", description: result.error, variant: "destructive" })
            return
        }
        toast({ title: "Location updated" })
        setEditingId(null)
        load()
    }

    const handleDelete = async (id: string) => {
        setBusyId(id)
        const result = await deleteLocationAction(id)
        setBusyId(null)
        if (!result.success) {
            toast({ title: "Could not remove location", description: result.error, variant: "destructive" })
            return
        }
        toast({ title: "Location removed" })
        load()
    }

    const handleSetPrimary = async (id: string) => {
        setBusyId(id)
        const result = await setPrimaryLocationAction(id)
        setBusyId(null)
        if (!result.success) {
            toast({ title: "Could not set primary location", description: result.error, variant: "destructive" })
            return
        }
        toast({ title: "Primary location updated" })
        load()
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                        <div>
                            <CardTitle>Shop Locations</CardTitle>
                            <CardDescription>Add every physical address where customers can find you.</CardDescription>
                        </div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)} disabled={adding}>
                        <Plus className="h-4 w-4 mr-1" /> Add Location
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {adding && <LocationForm onSave={handleAdd} onCancel={() => setAdding(false)} />}

                {!isLoading && locations.length === 0 && !adding && (
                    <p className="text-sm text-gray-500">No locations yet.</p>
                )}

                {locations.map((loc) =>
                    editingId === loc.id ? (
                        <LocationForm
                            key={loc.id}
                            initial={loc}
                            onSave={(values) => handleUpdate(loc.id, values)}
                            onCancel={() => setEditingId(null)}
                        />
                    ) : (
                        <div key={loc.id} className="flex items-center gap-3 rounded-lg border p-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium flex items-center gap-2">
                                    {loc.name}
                                    {loc.is_primary && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            <Star className="h-3 w-3" /> Primary
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {[loc.address, loc.city].filter(Boolean).join(", ") || "No address set"}
                                    {loc.phone ? ` · ${loc.phone}` : ""}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {!loc.is_primary && (
                                    <Button type="button" size="sm" variant="ghost" onClick={() => handleSetPrimary(loc.id)} disabled={busyId === loc.id} title="Set as primary">
                                        <Star className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(loc.id)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                {!loc.is_primary && (
                                    <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(loc.id)} disabled={busyId === loc.id}>
                                        {busyId === loc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    )
}
