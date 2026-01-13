'use client'

import Link from 'next/link'
import { Store, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const sellerTypes = [
    {
        id: 'wholesaler',
        title: 'Wholesaler',
        icon: Store,
        description: 'I supply products in bulk to retailers and businesses.',
        details: [
            'Sell large quantities at competitive prices',
            'Connect with retailers across Abuja',
            'Set your own Jara (bonus) offers',
            'Dashboard to manage orders and inventory'
        ],
        colorBg: 'bg-emerald-100',
        colorText: 'text-emerald-600',
        href: '/register/brand'
    },
    {
        id: 'retailer',
        title: 'Retailer',
        icon: ShoppingBag,
        description: 'I sell products directly to customers.',
        details: [
            'Physical shop, online, or market day seller',
            'Access wholesale prices and Jara deals',
            'Subscription plans to boost visibility',
            'Connect with trusted wholesalers'
        ],
        colorBg: 'bg-emerald-100',
        colorText: 'text-emerald-600',
        href: '/register/retailer-type'
    }
]

export default function SellerRegistrationPage() {
    return (
        <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-gray-50 via-white to-emerald-50">
            <div className="container mx-auto px-4 py-12">
                {/* Title Section */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Join MyJara as a Seller
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Are you a wholesaler or a retailer? Choose the option that best describes your business.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {sellerTypes.map((type, index) => (
                        <Card
                            key={type.id}
                            className="group relative overflow-hidden border-2 border-gray-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardContent className="p-8">
                                {/* Icon */}
                                <div className={`w-20 h-20 rounded-2xl ${type.colorBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <type.icon className={`h-10 w-10 ${type.colorText}`} />
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {type.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 mb-6">
                                    {type.description}
                                </p>

                                {/* Features List */}
                                <ul className="space-y-3 mb-8">
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
                                    <Link href={type.href}>
                                        Continue as {type.title}
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

                {/* Customer Link */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        Just want to shop?{' '}
                        <Link href="/register" className="text-emerald-600 font-medium hover:underline">
                            Create a customer account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
