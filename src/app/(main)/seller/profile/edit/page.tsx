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
import { ArrowLeft, Save, Plus, Trash2, MapPin, Store, Tag, Check, CreditCard, ImageIcon, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { PRODUCT_CATEGORIES, ABUJA_MARKETS } from '@/lib/constants'
import { ProfilePictureUpload } from '@/components/shared/profile-picture-upload'
import { ImageUpload } from '@/components/ui/image-upload'
import { useSellerStore } from '@/context/seller-store-context'

// Plan limits for categories
const PLAN_LIMITS: Record<string, number> = {
    basic: 5,
    pro: 15,
    exclusive: 30
}

export default function EditProfilePage() {
    const router = useRouter()
    const { store } = useSellerStore()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    // const [store, setStore] = useState<any>(null)

    // Form States
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [contacts, setContacts] = useState<{ name: string, number: string }[]>([])
    const [storeDescription, setStoreDescription] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
    const [profilePictureUrl, setProfilePictureUrl] = useState('')
    const [galleryUrls, setGalleryUrls] = useState<string[]>([])
    const [frequentMarkets, setFrequentMarkets] = useState<string[]>([])

    // Location (for market day)
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)
    const [gettingLocation, setGettingLocation] = useState(false)

    // Settlement Account
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [accountName, setAccountName] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single() as any
            // const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', user.id).single() as any

            setUser(userData)
            // setStore(storeData)

            // Populate Form
            if (userData) {
                setPhone(userData.phone || '')
                setAddress(userData.residential_address || '')
                setContacts(userData.emergency_contacts || [])
                setProfilePictureUrl(userData.avatar_url || '')
            }
            if (store) {
                setLat(store.latitude)
                setLng(store.longitude)
                setStoreDescription(store.description || '')
                setSelectedCategories(store.categories || [])
                setSelectedSubcategories((store as any).subcategories || [])
                setBankName((store as any).bank_name || '')
                setAccountNumber((store as any).account_number || '')
                setAccountName((store as any).account_name || '')
                setGalleryUrls(Array.isArray((store as any).gallery_urls) ? (store as any).gallery_urls : [])
                setFrequentMarkets(Array.isArray((store as any).frequent_markets) ? (store as any).frequent_markets : [])
            }
            setLoading(false)
        }
        fetchData()
    }, [router, store])

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
            subcategories: selectedSubcategories,
            profilePictureUrl,
            bankName,
            accountNumber,
            accountName,
            galleryUrls,
            frequentMarkets
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

                        {/* Store Gallery */}
                        <div className="space-y-2 pt-4 border-t">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-emerald-600" />
                                Store Photos
                            </Label>
                            <p className="text-xs text-gray-500 mb-2">Add photos of your store/shop. The first image will be your storefront banner.</p>
                            <ImageUpload
                                value={galleryUrls}
                                onChange={(urls) => setGalleryUrls(urls)}
                                maxFiles={6}
                                bucket="store-images"
                            />
                        </div>

                        {/* Market Day Locations (Only for market_day) */}
                        {store?.shop_type === 'market_day' && (
                            <div className="space-y-4 pt-4 border-t">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-emerald-600" />
                                    Market Schedules
                                </Label>
                                <p className="text-xs text-gray-500 mb-2">Select the markets you actively sell in. This helps customers find you on market days.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {ABUJA_MARKETS.map(market => {
                                        const isSelected = frequentMarkets.includes(market.name)
                                        return (
                                            <div
                                                key={market.name}
                                                onClick={() => {
                                                    setFrequentMarkets(prev =>
                                                        isSelected
                                                            ? prev.filter(m => m !== market.name)
                                                            : [...prev, market.name]
                                                    )
                                                }}
                                                className={`
                                                    cursor-pointer rounded-lg border p-3 transition-all hover:shadow-sm
                                                    ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}
                                                `}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className={`text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>{market.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">{market.days.join(', ')}</p>
                                                    </div>
                                                    {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {PRODUCT_CATEGORIES.map(category => {
                                const isSelected = selectedCategories.includes(category.id)
                                return (
                                    <div key={category.id} className="space-y-2">
                                        <div
                                            onClick={() => toggleCategory(category.id)}
                                            className={`
                                                cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                                                ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'}
                                            `}
                                        >
                                            <span className="text-2xl mb-2">{category.icon}</span>
                                            <span className={`text-sm font-medium text-center ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                {category.name}
                                            </span>
                                            {isSelected && <Check className="h-4 w-4 text-emerald-600 mt-2" />}
                                        </div>

                                        {/* Subcategories (Only if parent selected) */}
                                        {isSelected && category.subcategories && (
                                            <div className="pl-3 border-l-2 border-emerald-100 space-y-1 mt-2">
                                                {category.subcategories.map(sub => {
                                                    const isSubSelected = selectedSubcategories.includes(sub.id)
                                                    return (
                                                        <div
                                                            key={sub.id}
                                                            onClick={() => {
                                                                setSelectedSubcategories(prev =>
                                                                    isSubSelected
                                                                        ? prev.filter(id => id !== sub.id)
                                                                        : [...prev, sub.id]
                                                                )
                                                            }}
                                                            className={`
                                                                cursor-pointer text-xs px-2 py-1.5 rounded-md transition-colors flex items-center gap-2
                                                                ${isSubSelected ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-gray-500 hover:bg-gray-100'}
                                                            `}
                                                        >
                                                            <div className={`w-3 h-3 flex items-center justify-center rounded-sm border ${isSubSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                                                                {isSubSelected && <Check className="h-2 w-2 text-white" />}
                                                            </div>
                                                            {sub.name}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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

                {/* Settlement Account */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-emerald-500" />
                            Settlement Account
                        </CardTitle>
                        <CardDescription>
                            Add your bank account details to receive payments from sales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g., Access Bank, GTBank, UBA"
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input
                                    id="accountNumber"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    placeholder="10-digit account number"
                                    maxLength={10}
                                />
                            </div>
                            <div>
                                <Label htmlFor="accountName">Account Name</Label>
                                <Input
                                    id="accountName"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="Account holder name"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                    <Save className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
