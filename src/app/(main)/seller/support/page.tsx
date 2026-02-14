'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

export default function RetailerSupportPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        subject: '',
        type: 'complaint',
        priority: 'medium',
        description: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        // In a real app, this would call a server action to send email or save to DB
        console.log('Support Ticket Submitted:', formData)

        toast.success('Support ticket submitted successfully. We will contact you shortly.')
        setFormData({
            subject: '',
            type: 'complaint',
            priority: 'medium',
            description: ''
        })
        setIsSubmitting(false)
    }

    return (
        <div className="space-y-6 p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Retailer Support</h1>
                <p className="text-gray-500">
                    Log disputes, complaints, or ask for help. We are here to assist you.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Contact Form */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Submit a Ticket</CardTitle>
                            <CardDescription>
                                Verify your details and describe your issue clearly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Brief summary of the issue"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dispute">Dispute (Order/Payment)</SelectItem>
                                                <SelectItem value="complaint">Complaint</SelectItem>
                                                <SelectItem value="technical">Technical Issue</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(val) => setFormData({ ...formData, priority: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Please provide detailed information about your issue..."
                                        className="min-h-[150px]"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Submit Ticket
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Info Side Card */}
                <div className="space-y-6">
                    <Card className="bg-emerald-50 border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-emerald-800">Direct Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-emerald-900">Email Us</h4>
                                <p className="text-sm text-emerald-700">support@myjara.ng</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-emerald-900">Call Us</h4>
                                <p className="text-sm text-emerald-700">+234 800 MYJARA</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-emerald-900">Office Hours</h4>
                                <p className="text-sm text-emerald-700">Mon - Fri, 8am - 6pm</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>FAQ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-sm">How do I verify my store?</h4>
                                <p className="text-xs text-gray-500 mt-1">Go to Settings &gt; Verification and upload the required documents.</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">When do I get paid?</h4>
                                <p className="text-xs text-gray-500 mt-1">Payouts are processed every Tuesday for orders completed the previous week.</p>
                            </div>
                            <Button variant="link" className="p-0 h-auto text-emerald-600" asChild>
                                <a href="/help">Visit Help Center →</a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
