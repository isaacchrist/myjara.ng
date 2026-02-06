'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/app/actions/profile'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Plus, Trash2, MapPin, Store, Tag, Check } from 'lucide-react'
import { toast } from 'sonner'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { ProfilePictureUpload } from '@/components/shared/profile-picture-upload'

// Plan limits for categories
const PLAN_LIMITS: Record<string, number> = {
    basic: 5,
    pro: 15,
    exclusive: 30
}

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
    const [storeDescription, setStoreDescription] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [profilePictureUrl, setProfilePictureUrl] = useState('')

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
                setProfilePictureUrl(userData.avatar_url || '')
            }
            if (storeData) {
                setLat(storeData.latitude)
                setLng(storeData.longitude)
                setStoreDescription(storeData.description || '')
                setSelectedCategories(storeData.categories || [])
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

    const toggleCategory = (categoryId: string) => {
        const limit = PLAN_LIMITS[store?.subscription_plan || 'basic'] || 5

        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
        } else {
            if (selectedCategories.length >= limit) {
                toast.error(`Your ${store?.subscription_plan || 'basic'} plan allows only ${limit} categories. Upgrade to add more.`)
                return
            }
            setSelectedCategories([...selectedCategories, categoryId])
        }
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
            longitude: lng || undefined,
            storeDescription,
            categories: selectedCategories,
            profilePictureUrl
        })

        setSaving(false)

        if (result.success) {
            toast.success('Profile updated successfully')
            router.push('/seller/profile')
        } else {
            toast.error(result.error || 'Failed to update profile')
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>

    const isMarketDayRetailer = store?.shop_type === 'market_day'
    const categoryLimit = PLAN_LIMITS[store?.subscription_plan || 'basic'] || 5

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Edit Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex justify-center py-4">
                    <div className="flex flex-col items-center gap-2">
                        <Label>Profile Picture</Label>
                        <ProfilePictureUpload
                            value={profilePictureUrl}
                            onChange={(url) => setProfilePictureUrl(url || '')}
                        />
                    </div>
                </div>

                {/* Contact Information */}
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
                            <p className="text-xs text-gray-500">Must be unique across all users</p>
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

                {/* Store Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Store Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Store Description</Label>
                            <Textarea
                                value={storeDescription}
                                onChange={(e) => setStoreDescription(e.target.value)}
                                placeholder="Describe what your store offers..."
                                rows={4}
                            />
                            <p className="text-xs text-gray-500">Visible to customers on your store page</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Product Categories
                        </CardTitle>
                        <CardDescription>
                            Select categories you sell in ({selectedCategories.length}/{categoryLimit} selected)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {PRODUCT_CATEGORIES.map(category => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => toggleCategory(category.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${selectedCategories.includes(category.id)
                                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                                        : 'bg-white border-gray-200 hover:border-emerald-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{category.icon}</span>
                                        <span className="text-sm font-medium truncate">{category.name}</span>
                                        {selectedCategories.includes(category.id) && (
                                            <Check className="h-4 w-4 text-emerald-600 ml-auto shrink-0" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        {selectedCategories.length >= categoryLimit && (
                            <p className="text-sm text-amber-600 mt-3">
                                You've reached your category limit. <a href="/seller/subscription" className="underline">Upgrade your plan</a> to add more.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Emergency Contacts */}
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

                {/* Location for Market Day Retailers */}
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
                                Update your precise location when at the market for easier discovery.
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
                            {(lat || lng) && (
                                <div className="mt-2 text-right">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setLat(null); setLng(null); }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Remove Location
                                    </Button>
                                </div>
                            )}
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
