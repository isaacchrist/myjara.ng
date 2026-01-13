'use client'

import Link from 'next/link'
import { CheckCircle2, Zap, Crown, Heart, ArrowRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const subscriptionPlans = [
    {
        id: 'basic',
        name: 'Basic',
        price: 2000,
        icon: Zap,
        color: 'emerald',
        popular: false,
        features: [
            'Standard product visibility',
            'Access to all market day listings',
            'Basic customer support',
            'Monthly performance reports',
            'Up to 50 product listings'
        ]
    },
    {
        id: 'medium',
        name: 'Pro',
        price: 5000,
        icon: Crown,
        color: 'blue',
        popular: true,
        features: [
            'Priority search visibility',
            'Advanced sales analytics',
            'Email & WhatsApp support',
            'Jara deal notifications',
            'Up to 200 product listings',
            'Featured on category pages'
        ]
    },
    {
        id: 'pro',
        name: 'Exclusive',
        price: 7500,
        icon: Crown,
        color: 'purple',
        popular: false,
        features: [
            'Top search visibility',
            'Dedicated account manager',
            'Premium Jara offer access',
            'Instant push notifications',
            'Unlimited product listings',
            'Homepage featured spots',
            'Competitor price insights'
        ]
    }
]

export default function SupportPlatformPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white">
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
                            <Heart className="h-5 w-5 text-red-300" />
                            <span className="font-medium">Support MyJara's Growth</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
                            Help Us Build Nigeria's #1 Wholesale Marketplace
                        </h1>
                        <p className="text-xl text-emerald-100 mb-8">
                            Your subscription directly supports platform development, improved features,
                            and better deals for everyone. Choose a plan that works for your business.
                        </p>
                        <div className="flex items-center justify-center gap-8 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                <span>5,000+ Retailers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                <span>500+ Wholesalers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Plans */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Choose Your Plan
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        All plans include full access to the marketplace. Higher tiers offer better visibility
                        and premium features to help your business grow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {subscriptionPlans.map((plan, index) => (
                        <Card
                            key={plan.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${plan.popular
                                    ? 'border-2 border-blue-500 shadow-xl scale-105 md:scale-110'
                                    : 'border border-gray-200'
                                }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    MOST POPULAR
                                </div>
                            )}

                            <CardHeader className="text-center pb-4">
                                <div className={`w-14 h-14 rounded-2xl bg-${plan.color}-100 flex items-center justify-center mx-auto mb-4`}>
                                    <plan.icon className={`h-7 w-7 text-${plan.color}-600`} />
                                </div>
                                <CardTitle className="text-xl text-gray-900">{plan.name}</CardTitle>
                                <div className="mt-4">
                                    <span className="text-4xl font-extrabold text-gray-900">
                                        ₦{plan.price.toLocaleString()}
                                    </span>
                                    <span className="text-gray-500">/month</span>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="text-gray-600 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    asChild
                                    className={`w-full ${plan.popular
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-gray-900 hover:bg-emerald-600'
                                        }`}
                                >
                                    <Link href="/register/retailer-type">
                                        Get Started
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mt-20">
                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                        Frequently Asked Questions
                    </h3>
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                What happens if I don't renew?
                            </h4>
                            <p className="text-gray-600">
                                You'll receive reminder emails 3 days, 2 days, and on the day of renewal.
                                If not renewed within 24 hours after expiry, your account features will be paused
                                until you resubscribe.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Can I upgrade my plan later?
                            </h4>
                            <p className="text-gray-600">
                                Yes! You can upgrade at any time. The difference will be prorated for the remaining
                                days in your billing cycle.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Do you accept promo codes?
                            </h4>
                            <p className="text-gray-600">
                                Yes! During registration, you can enter a promo code to activate your subscription
                                without immediate payment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Footer */}
            <div className="bg-gray-900 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h3 className="text-2xl font-bold mb-4">
                        Ready to grow your business?
                    </h3>
                    <p className="text-gray-400 mb-8">
                        Join thousands of retailers already benefiting from MyJara's wholesale network.
                    </p>
                    <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/register/retailer-type">
                            Start Your Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
