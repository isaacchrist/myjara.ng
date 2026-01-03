import Link from 'next/link'
import {
    ShoppingBag,
    Gift,
    Truck,
    ShieldCheck,
    Store,
    Zap,
    ChevronRight,
    ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-emerald-950 py-24 text-white">
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <h1 className="mb-6 text-4xl font-extrabold md:text-6xl">
                        How <span className="text-emerald-400">MyJara</span> Works
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-emerald-100/80 md:text-xl">
                        The marketplace where every purchase comes with a little extra.
                        Experience the joy of "Jara" on Nigeria's most rewarding e-marketplace.
                    </p>
                </div>

                {/* Decorative background */}
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
            </section>

            {/* For Customers */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">For Shoppers</h2>
                        <p className="text-gray-500">Four simple steps to get more value for your money.</p>
                    </div>

                    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: ShoppingBag,
                                title: "1. Discover",
                                desc: "Browse thousands of products from verified local brands and stores.",
                                color: "bg-blue-100 text-blue-600"
                            },
                            {
                                icon: Gift,
                                title: "2. Get Jara",
                                desc: "Look for products with the 'Jara' tag to get bonus items or discounts on every purchase.",
                                color: "bg-emerald-100 text-emerald-600"
                            },
                            {
                                icon: ShieldCheck,
                                title: "3. Secure Pay",
                                desc: "Pay safely using Flutterwave. Your money is protected until your order is confirmed.",
                                color: "bg-purple-100 text-purple-600"
                            },
                            {
                                icon: Truck,
                                title: "4. Fast Delivery",
                                desc: "Get your items delivered to your doorstep or pick up from a nearby station.",
                                color: "bg-amber-100 text-amber-600"
                            }
                        ].map((step, i) => (
                            <div key={i} className="relative text-center">
                                <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${step.color}`}>
                                    <step.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-gray-900">{step.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                                {i < 3 && (
                                    <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gray-100 lg:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* For Brands */}
            <section className="bg-gray-50 py-24">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center gap-16 lg:flex-row">
                        <div className="flex-1 space-y-8">
                            <div>
                                <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Grow Your Business</h2>
                                <p className="text-lg text-gray-600">
                                    MyJara helps Nigerian brands reach more customers by leveraging the power of "Jara" – the extra value that Nigerians love.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    {
                                        title: "Easy Store Setup",
                                        desc: "Register your brand, customize your store theme, and start listing products in minutes.",
                                        icon: Store
                                    },
                                    {
                                        title: "Jara Engine",
                                        desc: "Create 'Buy 2 Get 1' or 'Bonus Item' offers easily to boost your sales conversion.",
                                        icon: Zap
                                    },
                                    {
                                        title: "Direct Customer Chat",
                                        desc: "Communicate directly with your customers through our built-in real-time support system.",
                                        icon: ChevronRight
                                    }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                                            <feature.icon className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{feature.title}</h4>
                                            <p className="text-gray-500">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button size="lg" className="rounded-full shadow-lg" asChild>
                                <Link href="/register/brand">
                                    Become a MyJara Partner <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <div className="flex-1">
                            <div className="relative aspect-square max-w-md mx-auto">
                                <div className="absolute inset-0 rounded-3xl bg-emerald-600/10 -rotate-6" />
                                <div className="absolute inset-0 rounded-3xl bg-emerald-600/10 rotate-3" />
                                <Card className="relative h-full w-full overflow-hidden border-0 shadow-2xl">
                                    <CardContent className="flex flex-col items-center justify-center h-full p-12 text-center">
                                        <div className="mb-6 h-24 w-24 rounded-full bg-emerald-100 p-6">
                                            <Gift className="h-full w-full text-emerald-600" />
                                        </div>
                                        <h3 className="mb-4 text-2xl font-bold">Offer Jara. Sell Fast.</h3>
                                        <p className="text-gray-500 mb-8">
                                            Brands who offer Jara see up to <span className="font-bold text-emerald-600">45% higher</span> conversion rates.
                                        </p>
                                        <div className="w-full space-y-4 text-left">
                                            <div className="h-3 w-1/2 rounded-full bg-gray-100" />
                                            <div className="h-3 w-full rounded-full bg-gray-100" />
                                            <div className="h-3 w-3/4 rounded-full bg-gray-100" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ or Start Now */}
            <section className="py-24 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="mb-8 text-3xl font-bold">Ready to experience Jara?</h2>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button size="lg" className="rounded-full px-8" asChild>
                            <Link href="/search">Start Shopping</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                            <Link href="/login">Explore Brand Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
