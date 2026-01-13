'use client'

import { useState } from 'react'
import {
    Mail,
    MessageSquare,
    MapPin,
    Phone,
    Send,
    CheckCircle2,
    Clock,
    HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function ContactPage() {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsSubmitting(false)
        setSubmitted(true)
        toast({
            title: "Message Sent",
            description: "We've received your inquiry and will get back to you soon.",
        })
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="mx-auto h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Thank You!</h1>
                    <p className="text-gray-500 text-lg">
                        Your message has been successfully sent. Our support team typically responds within 24 hours.
                    </p>
                    <Button variant="outline" className="rounded-full" onClick={() => setSubmitted(false)}>
                        Send another message
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <section className="bg-emerald-900 py-20 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold md:text-5xl">Contact Us</h1>
                    <p className="mt-4 text-lg text-emerald-100/80">
                        Have questions about Jara or your store? We're here to help.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid gap-12 lg:grid-cols-3">
                        {/* Info Cards */}
                        <div className="space-y-6 lg:col-span-1">
                            {[
                                {
                                    icon: Mail,
                                    title: "Email Us",
                                    value: "support@myjara.ng",
                                    desc: "For general inquiries and support"
                                },
                                {
                                    icon: Clock,
                                    title: "Working Hours",
                                    value: "Mon - Fri, 9am - 6pm",
                                    desc: "Standard WAT (West Africa Time)"
                                },
                                {
                                    icon: MapPin,
                                    title: "Our Location",
                                    value: "Lagos, Nigeria",
                                    desc: "Headquarters & Operations"
                                }
                            ].map((item, i) => (
                                <Card key={i} className="border-0 shadow-sm border-l-4 border-l-emerald-500">
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div className="h-10 w-10 shrink-0 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{item.title}</p>
                                            <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
                                            <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <Card className="bg-emerald-600 text-white border-0">
                                <CardContent className="p-8 text-center space-y-4">
                                    <HelpCircle className="h-12 w-12 mx-auto opacity-50" />
                                    <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
                                    <p className="text-emerald-50/80">Find quick answers to common questions in our center.</p>
                                    <Button variant="secondary" className="w-full rounded-full">
                                        Visit Help Center
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <Card className="border-0 shadow-xl overflow-hidden">
                                <div className="bg-white p-8 md:p-12">
                                    <h2 className="text-2xl font-bold mb-8">Send us a message</h2>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Full Name</label>
                                                <Input placeholder="John Doe" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Email Address</label>
                                                <Input type="email" placeholder="john@example.com" required />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Subject</label>
                                            <select className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                                <option>General Inquiry</option>
                                                <option>Order Support</option>
                                                <option>Become a Brand Partner</option>
                                                <option>Technical Issue</option>
                                                <option>Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Message</label>
                                            <Textarea
                                                className="min-h-[160px]"
                                                placeholder="Tell us more about your inquiry..."
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full md:w-auto px-12 rounded-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Sending..." : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
