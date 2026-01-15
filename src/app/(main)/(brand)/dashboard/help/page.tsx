"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react"

const DISPUTE_CAUSES = [
    { value: 'payment', label: '💳 Payment Issue', description: 'Problems with payment processing or refunds' },
    { value: 'delivery', label: '🚚 Delivery Issue', description: 'Order not delivered or delayed' },
    { value: 'product_quality', label: '📦 Product Quality', description: 'Received wrong or damaged item' },
    { value: 'account', label: '👤 Account Issue', description: 'Verification, login, or profile problems' },
    { value: 'other', label: '❓ Other', description: 'Any other issue not listed above' },
]

export default function HelpCenterPage() {
    const [cause, setCause] = useState("")
    const [subject, setSubject] = useState("")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setStatus('idle')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error("Unauthorized")

            const { error } = await (supabase as any)
                .from('disputes')
                .insert({
                    user_id: user.id,
                    subject,
                    description,
                    cause,
                    status: 'open'
                })

            if (error) throw error

            setStatus('success')
            setCause("")
            setSubject("")
            setDescription("")
        } catch (err) {
            console.error(err)
            setStatus('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <HelpCircle className="h-8 w-8 text-emerald-600" /> Help Center
                </h1>
                <p className="text-gray-500 mt-2">Submit a ticket for disputes, account issues, or general inquiries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Submit Form */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Submit a New Request</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Cause Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">What's this about? *</label>
                                <div className="grid gap-2">
                                    {DISPUTE_CAUSES.map((c) => (
                                        <label
                                            key={c.value}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${cause === c.value
                                                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="cause"
                                                value={c.value}
                                                checked={cause === c.value}
                                                onChange={(e) => setCause(e.target.value)}
                                                className="sr-only"
                                            />
                                            <span className="text-lg">{c.label.split(' ')[0]}</span>
                                            <div>
                                                <div className="font-medium text-sm">{c.label.split(' ').slice(1).join(' ')}</div>
                                                <div className="text-xs text-gray-500">{c.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject *</label>
                                <Input
                                    placeholder="e.g. Order #1234 issue"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description *</label>
                                <textarea
                                    className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[120px]"
                                    placeholder="Describe your issue in detail..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={isSubmitting || !cause}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                Submit Ticket
                            </Button>

                            {status === 'success' && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4" /> Ticket submitted successfully. We'll respond shortly.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4" /> Failed to submit. Please try again.
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Info / Previous Tickets */}
                <div className="space-y-6">
                    <Card className="bg-emerald-50 border-emerald-100">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-emerald-900 mb-2">Tips for Faster Resolution</h3>
                            <ul className="list-disc list-inside text-sm text-emerald-800 space-y-2">
                                <li>Include order numbers if applicable</li>
                                <li>Attach screenshots if possible</li>
                                <li>Provide your contact phone number</li>
                                <li>Be specific about dates and amounts</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Your Recent Tickets</h3>
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <p>No ticket history available yet.</p>
                                <p className="text-xs mt-1">(History view coming soon)</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

