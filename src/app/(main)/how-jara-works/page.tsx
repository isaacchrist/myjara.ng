'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingBag, Gift, Truck, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HowJaraWorksPage() {
    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-900 py-24 text-center text-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative container mx-auto px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 text-4xl font-bold tracking-tight md:text-6xl"
                    >
                        How <span className="text-emerald-300">Jara</span> Works
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto max-w-2xl text-lg text-emerald-100 md:text-xl"
                    >
                        Jara isn't just a marketplace—it's a culture of giving.
                        Every time you shop, you get something extra. No promo codes, no hassle.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-10 flex justify-center gap-4"
                    >
                        <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50" asChild>
                            <Link href="/register">Start Selling</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="border-emerald-200 text-emerald-100 hover:bg-white/10" asChild>
                            <Link href="/search">Start Shopping</Link>
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="grid gap-12 md:grid-cols-3">
                    {/* Step 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="group relative rounded-2xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                            <ShoppingBag className="h-8 w-8" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900">1. Shop Your Favorites</h3>
                        <p className="text-gray-600">
                            Browse thousands of products from trusted Nigerian retailers and wholesalers.
                            Look for the <strong>Jara Badge</strong> on qualifying items.
                        </p>
                    </motion.div>

                    {/* Step 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="group relative rounded-2xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                            <Gift className="h-8 w-8" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900">2. Unlock Your Jara</h3>
                        <p className="text-gray-600">
                            Buy the required quantity (e.g., "Buy 2") and automatically unlock your free bonus items ("Get 1 Free").
                            Transparency is key—you see exactly what you get.
                        </p>
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="group relative rounded-2xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                            <Truck className="h-8 w-8" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900">3. Fast Delivery</h3>
                        <p className="text-gray-600">
                            Your order, including your free Jara items, is packed and delivered straight to your doorstep.
                            Enjoy the extra value with every purchase!
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* For Sellers Section */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="mb-12 text-3xl font-bold text-gray-900">Why Sell on MyJara?</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            { title: 'Zero Listing Fees', desc: 'List unlimited products for free. We only make money when you sell.' },
                            { title: 'Built-in Marketing', desc: 'The "Jara" model naturally attracts customers looking for value deals.' },
                            { title: 'Secure Payments', desc: 'Receive payments directly to your wallet via our secure escrow system.' },
                            { title: 'Business Tools', desc: 'Track sales, manage inventory, and view analytics from your dashboard.' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: i * 0.1 }}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                                <Link href="/how-jara-works" className="text-sm text-gray-500 hover:text-emerald-600">
                                    How Jara Works
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                            <Link href="/register/retailer">
                                Become a Seller <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
