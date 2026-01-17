'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, User, MapPin, Phone } from 'lucide-react'

interface SettingsFormProps {
    user: {
        id: string
        full_name: string
        email: string
        phone: string | null
        billing_address: string | null
        home_address: string | null
    }
}

export function SettingsForm({ user }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        phone: user.phone || '',
        home_address: user.home_address || '',
        billing_address: user.billing_address || ''
    })
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    home_address: formData.home_address,
                    billing_address: formData.billing_address
                })
                .eq('id', user.id)

            if (error) throw error

            toast({
                title: 'Profile Updated',
                description: 'Your changes have been saved successfully.',
            })
            router.refresh()
        } catch (error) {
            console.error('Error updating profile:', error)
            toast({
                title: 'Error',
                description: 'Failed to update profile. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your basic contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="pl-9"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="pl-9"
                                    placeholder="+234..."
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Addresses</CardTitle>
                    <CardDescription>Manage your billing and shipping locations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="home_address">Home / Delivery Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Textarea
                                id="home_address"
                                name="home_address"
                                value={formData.home_address}
                                onChange={handleChange}
                                className="pl-9 min-h-[80px]"
                                placeholder="123 Street, City, State"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="billing_address">Billing Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Textarea
                                id="billing_address"
                                name="billing_address"
                                value={formData.billing_address}
                                onChange={handleChange}
                                className="pl-9 min-h-[80px]"
                                placeholder="Same as home address..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="min-w-[150px] bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
