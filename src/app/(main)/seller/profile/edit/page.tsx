'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/app/actions/profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Plus, Trash2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function EditProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [store, setStore] = useState<any>(null)

    // Form States
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [contacts, setContacts] = useState<{ name: string, number: string }[]>([])

    // Location (for market day)
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)
    const [gettingLocation, setGettingLocation] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single() as any
            const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', user.id).single() as any

            setUser(userData)
            setStore(storeData)

            // Populate Form
            if (userData) {
                setPhone(userData.phone || '')
                setAddress(userData.residential_address || '')
                setContacts(userData.emergency_contacts || [])
            }
            if (storeData) {
                setLat(storeData.latitude)
                setLng(storeData.longitude)
            }
            setLoading(false)
        }
        fetchData()
    }, [router])

    const handleAddContact = () => {
        if (contacts.length >= 2) return
        setContacts([...contacts, { name: '', number: '' }])
    }

    const handleRemoveContact = (index: number) => {
        const newContacts = [...contacts]
        newContacts.splice(index, 1)
        setContacts(newContacts)
    }

    const handleContactChange = (index: number, field: 'name' | 'number', value: string) => {
        const newContacts = [...contacts]
        newContacts[index][field] = value
        setContacts(newContacts)
    }

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            return
        }
        setGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLat(position.coords.latitude)
                setLng(position.coords.longitude)
                setGettingLocation(false)
                toast.success('Location captured!')
            },
            (error) => {
                console.error(error)
                toast.error('Unable to retrieve location')
                setGettingLocation(false)
            }
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        // Validate Contacts
        const validContacts = contacts.filter(c => c.number.trim().length > 0)

        const result = await updateProfile({
            phone,
            residentialAddress: address,
            emergencyContacts: validContacts,
            latitude: lat || undefined,
            longitude: lng || undefined
        })

        setSaving(false)

        if (result.success) {
            toast.success('Profile updated successfully')
            router.push('/seller/profile')
        } else {
            toast.error(result.error || 'Failed to update profile')
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    const isMarketDayRetailer = store?.shop_type === 'market_day'

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Edit Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+234..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Residential Address</Label>
                            <Textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter your full address"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Emergency Contacts (Max 2)</CardTitle>
                        {contacts.length < 2 && (
                            <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {contacts.length === 0 && (
                            <p className="text-sm text-gray-500">No emergency contacts added.</p>
                        )}
                        {contacts.map((contact, idx) => (
                            <div key={idx} className="flex gap-3 items-end p-3 border rounded-lg bg-gray-50">
                                <div className="flex-1 space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={contact.name}
                                        onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                                        placeholder="Contact Name"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>Number</Label>
                                    <Input
                                        value={contact.number}
                                        onChange={(e) => handleContactChange(idx, 'number', e.target.value)}
                                        placeholder="Phone Number"
                                    />
                                </div>
                                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveContact(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {isMarketDayRetailer && (
                    <Card className="border-emerald-200 bg-emerald-50/50">
                        <CardHeader>
                            <CardTitle className="text-emerald-800 flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Market Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-emerald-700">
                                Since you are a Market Day retailer, you can update your precise location when you are at the market.
                            </p>
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={gettingLocation}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {gettingLocation ? 'Locating...' : 'Update GPS Location'}
                                </Button>
                                {lat && lng && (
                                    <span className="text-sm font-mono text-emerald-800">
                                        {lat.toFixed(6)}, {lng.toFixed(6)}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                    <Save className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
