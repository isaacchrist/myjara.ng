'use client'

import Link from 'next/link'
import { Store, Globe, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const retailerTypes = [
    {
        id: 'physical',
        title: 'Physical Store Retailer',
        icon: Store,
        description: 'I have a permanent shop location where customers can visit.',
        details: [
            'Ideal for shop owners with fixed premises',
            'Display your shop address so customers can visit',
            'Build local reputation and trust',
            'Connect with nearby wholesalers for stock'
        ],
        color: 'emerald'
    },
    {
        id: 'online',
        title: 'Online Store Retailer',
        icon: Globe,
        description: 'I sell primarily through social media or online platforms.',
        details: [
            'Perfect for Instagram, WhatsApp, or Facebook sellers',
            'Reach customers across Abuja without a physical shop',
            'Flexible business model',
            'Logistics integration available'
        ],
        color: 'blue'
    },
    {
        id: 'market_day',
        title: 'Market Day Retailer',
        icon: ShoppingBag,
        description: 'I sell at major markets in Abuja on specific days.',
        details: [
            'For traders at Wuse, Garki, Nyanya, Kuje markets',
            'Show which markets and days you operate',
            'Connect with customers looking for market-day deals',
            'Access wholesale prices for bulk buying'
        ],
        color: 'orange'
    }
]

export default function RetailerTypePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
            {/* Header */}
            <div className="border-b bg-white/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/" className="inline-block">
                        <span className="text-3xl font-bold text-emerald-600 tracking-wide" style={{ fontFamily: '"Lobster", cursive' }}>
                            MyJara
                        </span>
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Title Section */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        What type of retailer are you?
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the option that best describes how you sell. This helps us tailor your experience and connect you with the right wholesalers.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {retailerTypes.map((type, index) => (
                        <Card
                            key={type.id}
                            className="group relative overflow-hidden border-2 border-gray-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardContent className="p-8">
                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-2xl bg-${type.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <type.icon className={`h-8 w-8 text-${type.color}-600`} />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {type.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 mb-6">
                                    {type.description}
                                </p>

                                {/* Features List */}
                                <ul className="space-y-2 mb-8">
                                    {type.details.map((detail, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                                            <span className="text-emerald-500 mt-0.5">✓</span>
                                            {detail}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <Button
                                    asChild
                                    className="w-full bg-gray-900 hover:bg-emerald-600 transition-colors group-hover:bg-emerald-600"
                                >
                                    <Link href={`/register/retailer?type=${type.id}`}>
                                        Select & Continue
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </CardContent>

                            {/* Hover Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </Card>
                    ))}
                </div>

                {/* Already have account */}
                <div className="text-center mt-12">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </div>

                {/* Wholesaler Link */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        Are you a wholesaler?{' '}
                        <Link href="/register/brand" className="text-emerald-600 font-medium hover:underline">
                            Register as a Wholesaler instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
