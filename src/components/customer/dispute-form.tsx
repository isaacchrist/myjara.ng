'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send } from 'lucide-react'

export function DisputeForm({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        order_id: '',
        reason: '',
        description: ''
    })
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.reason || !formData.order_id) {
            toast({
                title: "Missing Information",
                description: "Please provide an Order ID and a Reason.",
                variant: 'destructive'
            })
            setLoading(false)
            return
        }

        try {
            const { error } = await (supabase
                .from('disputes') as any)
                .insert({
                    customer_id: userId,
                    order_id: formData.order_id,
                    reason: formData.reason,
                    description: formData.description,
                    status: 'pending'
                })

            if (error) throw error

            toast({
                title: 'Dispute Submitted',
                description: 'We have received your dispute and will review it shortly.',
            })
            router.push('/customer/disputes')
            router.refresh()
        } catch (error) {
            console.error('Error submitting dispute:', error)
            toast({
                title: 'Error',
                description: 'Failed to submit dispute. Please try again.',
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
                    <CardTitle>Dispute Details</CardTitle>
                    <CardDescription>Tell us what went wrong with your order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="order_id">Order ID</Label>
                        <Input
                            id="order_id"
                            placeholder="e.g. 550e8400..."
                            value={formData.order_id}
                            onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500">You can find this in your Order History.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Select
                            value={formData.reason}
                            onValueChange={(val) => setFormData({ ...formData, reason: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="item_not_received">Item not received</SelectItem>
                                <SelectItem value="item_damaged">Item damaged/defective</SelectItem>
                                <SelectItem value="wrong_item">Wrong item sent</SelectItem>
                                <SelectItem value="missing_parts">Missing parts</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Please provide more details..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[120px]"
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="min-w-[150px] bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Dispute
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
