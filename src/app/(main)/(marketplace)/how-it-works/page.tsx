'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
    ShoppingBag,
    Gift,
    Truck,
    Store,
    Zap,
    ArrowRight,
    ChevronDown,
    Search,
    MessageCircle,
    CreditCard,
    Package,
    CheckCircle2,
    Clock,
    AlertTriangle,
    MapPin,
    Building2,
    BarChart3,
    Palette,
    Globe,
    Wallet,
    FileCheck,
    Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Role = 'shopper' | 'retailer' | 'wholesaler'

const ROLE_TABS: { id: Role; label: string; icon: typeof ShoppingBag }[] = [
    { id: 'shopper', label: 'I\'m a Shopper', icon: ShoppingBag },
    { id: 'retailer', label: 'I\'m a Retailer', icon: Store },
    { id: 'wholesaler', label: 'I\'m a Wholesaler', icon: Building2 },
]

const JARA_PRESETS = [
    { label: 'Buy 2, Get 1', buy: 2, get: 1 },
    { label: 'Buy 3, Get 1', buy: 3, get: 1 },
    { label: 'Buy 5, Get 2', buy: 5, get: 2 },
]

const ORDER_STEPS = [
    {
        status: 'Pending',
        icon: Clock,
        desc: 'Your order is created the moment you check out, before payment is confirmed.',
    },
    {
        status: 'Paid',
        icon: CreditCard,
        desc: 'Flutterwave confirms your payment (card, bank transfer, USSD, or mobile money) and the seller is notified instantly.',
    },
    {
        status: 'Processing',
        icon: Package,
        desc: 'The seller packs your items — including every bonus Jara item your order earned.',
    },
    {
        status: 'Shipped',
        icon: Truck,
        desc: 'Your order is on its way, or ready for pickup if you chose a pickup option. You get an email update.',
    },
    {
        status: 'Delivered',
        icon: CheckCircle2,
        desc: 'Order complete. You can reorder, or message the seller again anytime from the same chat thread.',
    },
]

const SHOP_TYPES = [
    {
        icon: Store,
        title: 'Physical Store',
        desc: 'You trade from a fixed shop. Your address is shown on your storefront so shoppers know exactly where to find you.',
    },
    {
        icon: Globe,
        title: 'Online Store',
        desc: 'You sell through Instagram, WhatsApp, or Facebook and use MyJara as your storefront, checkout, and order tracker — no physical shop required.',
    },
    {
        icon: MapPin,
        title: 'Market Day Trader',
        desc: 'You trade at a named Abuja market — Wuse, Garki, Nyanya, Kuje, and more — on specific days. Shoppers can find you in the Market Day directory.',
    },
]

const WHOLESALER_STEPS = [
    {
        title: '1. Personal details',
        items: ['Your name, phone number, and login email — same as any account on MyJara.'],
    },
    {
        title: '2. Legal & business identity',
        items: [
            'RC or BN registration number',
            'CAC certificate upload',
            'Tax Identification Number (TIN)',
            'Authorized signatory name and role',
            'A business phone number, separate from your personal one',
            'NAFDAC number, if you sell food, drugs, or cosmetics',
        ],
    },
    {
        title: '3. Trading profile & banking',
        items: [
            'Sales model — B2B, B2C, or both',
            'Expected order volume and minimum order quantity',
            'Delivery, pickup, or both, plus your coverage area',
            'Payment terms and years in business',
            'Settlement bank details, so payouts aren\'t held up later',
            'An optional product catalog upload to speed up your first listings',
        ],
    },
    {
        title: '4. Business details & location',
        items: ['Trading name, legal name if different, and your business location.'],
    },
]

const RETAILER_TOOLKIT = [
    { icon: Palette, title: 'Storefront branding', desc: 'A theme color, social links, and gallery images for your public store page.' },
    { icon: MapPin, title: 'Multiple locations', desc: 'Physical retailers can list more than one shop location, each shown with a map link.' },
    { icon: Zap, title: 'Jara offers', desc: 'Set a "Buy X, Get Y" bonus on any product in seconds, with a live preview as you type.' },
    { icon: Package, title: 'Order management', desc: 'Track every order from paid through delivered, with packing reminders for Jara bonus items.' },
    { icon: MessageCircle, title: 'Direct chat', desc: 'Answer pre-purchase questions and support requests in real time, right from the order page.' },
    { icon: BarChart3, title: 'Jara analytics', desc: 'See revenue plus which Jara offers actually move units, broken down by category and location.' },
]

const FAQ_ITEMS = [
    {
        q: 'What exactly is "Jara"?',
        a: 'Jara is the Nigerian tradition of getting a little something extra thrown in with a purchase. On MyJara, a seller sets a "Buy X, Get Y" rule on a product — buy that many, and the extra items are added to your order automatically, free.',
    },
    {
        q: 'How is my Jara bonus calculated?',
        a: 'It scales with quantity: bonus items = floor(quantity you buy ÷ buy amount) × get amount. Buy 6 of a "Buy 2, Get 1" product and you receive 3 bonus items. Try the calculator above with your own numbers.',
    },
    {
        q: 'Is my payment safe?',
        a: 'Payment is processed through Flutterwave — cards, bank transfer, USSD, and mobile money are all supported. If anything about an order goes wrong, you or the seller can flag the order or chat thread as a dispute, and our team steps in directly to resolve it.',
    },
    {
        q: 'How long does seller verification take?',
        a: 'After you register as a retailer or wholesaler, your store is reviewed within about 24 hours. While it\'s pending, your dashboard runs in preview mode — you can explore it, but products and payments stay locked until approval.',
    },
    {
        q: 'What\'s the difference between a retailer and a wholesaler account?',
        a: 'Retailers sell directly to shoppers as a physical shop, an online-only store, or a market day trader. Wholesalers supply in bulk to retailers and businesses, and go through an extra legitimacy check — CAC certificate, TIN, and a trading profile covering order volume, minimum order quantity, and payment terms.',
    },
    {
        q: 'Can I pick up my order instead of getting it delivered?',
        a: 'It depends on the store — each seller sets their own delivery and pickup options, with a fee and timeline for each. You choose one at checkout.',
    },
    {
        q: 'Where does MyJara operate?',
        a: 'MyJara is rooted in Abuja, Nigeria, with a dedicated directory for Abuja market-day traders — Wuse, Garki, Nyanya, Kuje, and more — alongside online and physical stores that ship or deliver more broadly.',
    },
    {
        q: 'Can I use my own domain for my store?',
        a: 'Every store gets a free storename.myjara.com.ng subdomain. Wholesalers can additionally connect their own domain once they verify ownership of it; this isn\'t yet available for retailer accounts.',
    },
]

function JaraCalculator() {
    const [buy, setBuy] = useState(2)
    const [get, setGet] = useState(1)
    const [quantity, setQuantity] = useState(4)

    const bonus = useMemo(() => {
        if (buy <= 0 || get <= 0) return 0
        return Math.floor(quantity / buy) * get
    }, [buy, get, quantity])

    const extraValuePct = quantity > 0 ? Math.round((bonus / quantity) * 100) : 0

    return (
        <Card className="border-0 shadow-xl">
            <CardContent className="p-6 md:p-10">
                <div className="mb-8 flex flex-wrap gap-2">
                    {JARA_PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                setBuy(preset.buy)
                                setGet(preset.get)
                            }}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                buy === preset.buy && get === preset.get
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-500">Buy this many</span>
                        <input
                            type="number"
                            min={1}
                            value={buy}
                            onChange={(e) => setBuy(Math.max(1, Number(e.target.value)))}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-bold text-gray-900 focus:border-emerald-500 focus:outline-none"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-500">Get this many free</span>
                        <input
                            type="number"
                            min={1}
                            value={get}
                            onChange={(e) => setGet(Math.max(1, Number(e.target.value)))}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-bold text-gray-900 focus:border-emerald-500 focus:outline-none"
                        />
                    </label>
                </div>

                {/* Cart quantity is a live slider — it drives every number below */}
                <label className="mt-6 block">
                    <span className="mb-2 flex items-center justify-between text-sm font-medium text-gray-500">
                        <span>Items in your cart</span>
                        <span className="text-lg font-extrabold text-emerald-700 tabular-nums">{quantity}</span>
                    </span>
                    <input
                        type="range"
                        min={1}
                        max={30}
                        value={Math.min(quantity, 30)}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                    />
                    <span className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>1</span>
                        <span>drag &mdash; everything below updates live</span>
                        <span>30</span>
                    </span>
                </label>

                {/* Live result: paid + jara = total, with the true running percentage */}
                <div className="mt-8 rounded-2xl bg-emerald-950 p-8 text-white">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-3xl font-extrabold tabular-nums">{quantity}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/50">You pay for</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold tabular-nums text-amber-400">+{bonus}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/50">Jara, free</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold tabular-nums text-emerald-300">{quantity + bonus}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/50">In your bag</div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-center">
                        <Gift className="h-5 w-5 shrink-0 text-emerald-400" />
                        <p className="text-sm text-emerald-100/80">
                            {bonus > 0 ? (
                                <>That&apos;s <span className="font-bold text-amber-400">{extraValuePct}% more</span> for the same money &mdash; recalculated live from your numbers.</>
                            ) : (
                                <>Add <span className="font-bold text-amber-400">{buy - quantity}</span> more to unlock your first {get} free.</>
                            )}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function OrderJourney() {
    const [active, setActive] = useState(0)
    return (
        <div>
            <div className="flex flex-wrap gap-3 sm:flex-nowrap sm:overflow-x-auto">
                {ORDER_STEPS.map((step, i) => (
                    <button
                        key={step.status}
                        onClick={() => setActive(i)}
                        className={`flex flex-1 min-w-[7rem] flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors ${
                            active === i
                                ? 'border-emerald-600 bg-emerald-50'
                                : 'border-gray-200 bg-white hover:border-emerald-200'
                        }`}
                    >
                        <step.icon className={`h-6 w-6 ${active === i ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-bold ${active === i ? 'text-emerald-700' : 'text-gray-600'}`}>
                            {step.status}
                        </span>
                    </button>
                ))}
            </div>
            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-gray-700">
                <p className="text-lg leading-relaxed">{ORDER_STEPS[active].desc}</p>
            </div>
        </div>
    )
}

function Accordion({ items }: { items: { title: string; content: React.ReactNode }[] }) {
    const [open, setOpen] = useState<number | null>(0)
    return (
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
            {items.map((item, i) => (
                <div key={item.title}>
                    <button
                        onClick={() => setOpen(open === i ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                        <span className="font-bold text-gray-900">{item.title}</span>
                        <ChevronDown
                            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {open === i && <div className="px-6 pb-6 text-gray-600">{item.content}</div>}
                </div>
            ))}
        </div>
    )
}

function ShopperSection() {
    return (
        <div className="space-y-16">
            <div className="grid gap-8 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 p-6">
                    <Search className="mb-4 h-8 w-8 text-emerald-600" />
                    <h3 className="mb-2 font-bold text-gray-900">Search every store at once</h3>
                    <p className="text-gray-500">
                        Filter by category, price, city, or &quot;Jara Deals Only&quot; across every active store in one search.
                    </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-6">
                    <Store className="mb-4 h-8 w-8 text-emerald-600" />
                    <h3 className="mb-2 font-bold text-gray-900">Or visit a store directly</h3>
                    <p className="text-gray-500">
                        Every seller has their own branded page at storename.myjara.com.ng, or their own connected domain.
                    </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-6">
                    <MapPin className="mb-4 h-8 w-8 text-emerald-600" />
                    <h3 className="mb-2 font-bold text-gray-900">Browse the market directory</h3>
                    <p className="text-gray-500">
                        Looking for a physical market? Browse Abuja market-day traders by market and by day.
                    </p>
                </div>
            </div>

            <div>
                <h3 className="mb-6 text-2xl font-bold text-gray-900">Track your order, step by step</h3>
                <OrderJourney />
            </div>

            <div className="flex gap-4 rounded-2xl bg-amber-50 p-6">
                <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
                <p className="text-gray-700">
                    Something wrong with an order? Flag it directly from the order page or your chat with the
                    seller — it opens a dispute our team reviews, without you having to leave the conversation.
                </p>
            </div>
        </div>
    )
}

function RetailerSection() {
    return (
        <div className="space-y-16">
            <div>
                <h3 className="mb-6 text-2xl font-bold text-gray-900">Pick the retail style that fits you</h3>
                <div className="grid gap-6 md:grid-cols-3">
                    {SHOP_TYPES.map((type) => (
                        <div key={type.title} className="rounded-2xl border border-gray-100 p-6">
                            <type.icon className="mb-4 h-8 w-8 text-emerald-600" />
                            <h4 className="mb-2 font-bold text-gray-900">{type.title}</h4>
                            <p className="text-gray-500">{type.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-6 text-2xl font-bold text-gray-900">From registration to your first sale</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        { icon: FileCheck, title: 'Apply', desc: 'Register with your ID, shop type, location, and product categories.' },
                        { icon: Clock, title: 'Review (~24h)', desc: 'Your dashboard opens in preview mode while our team verifies your store.' },
                        { icon: CheckCircle2, title: 'Go live', desc: 'Once approved, products and payments unlock and your store goes active.' },
                    ].map((step) => (
                        <div key={step.title} className="rounded-2xl bg-gray-50 p-6 text-center">
                            <step.icon className="mx-auto mb-3 h-7 w-7 text-emerald-600" />
                            <h4 className="mb-1 font-bold text-gray-900">{step.title}</h4>
                            <p className="text-sm text-gray-500">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-6 text-2xl font-bold text-gray-900">Your seller toolkit</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {RETAILER_TOOLKIT.map((tool) => (
                        <div key={tool.title} className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                                <tool.icon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{tool.title}</h4>
                                <p className="text-gray-500">{tool.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-gray-500">
                New stores start on a one-month trial; after that, your store runs on a subscription plan priced
                for your shop type.
            </p>
        </div>
    )
}

function WholesalerSection() {
    return (
        <div className="space-y-16">
            <div className="flex gap-4 rounded-2xl bg-emerald-50 p-6">
                <Users className="h-6 w-6 shrink-0 text-emerald-700" />
                <p className="text-gray-700">
                    Wholesaler accounts are built for businesses that supply products in bulk to retailers and
                    other businesses, rather than selling one item at a time to individual shoppers. Because
                    you&apos;re trading at that scale, registration verifies your business as a real, legitimate
                    entity before you go live.
                </p>
            </div>

            <div>
                <h3 className="mb-6 text-2xl font-bold text-gray-900">The wholesaler registration wizard</h3>
                <Accordion
                    items={WHOLESALER_STEPS.map((step) => ({
                        title: step.title,
                        content: (
                            <ul className="list-disc space-y-1 pl-5">
                                {step.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        ),
                    }))}
                />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 p-6">
                    <Clock className="mb-4 h-8 w-8 text-emerald-600" />
                    <h4 className="mb-2 font-bold text-gray-900">Same ~24 hour review</h4>
                    <p className="text-gray-500">
                        Your dashboard opens in preview mode while our team verifies your CAC and business details,
                        then unlocks products and payments once approved.
                    </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-6">
                    <Wallet className="mb-4 h-8 w-8 text-emerald-600" />
                    <h4 className="mb-2 font-bold text-gray-900">Settlement set up front</h4>
                    <p className="text-gray-500">
                        You add your settlement bank details during registration, so payouts are never held up by
                        a missing second step later.
                    </p>
                </div>
            </div>

            <div>
                <h3 className="mb-6 text-2xl font-bold text-gray-900">Once you&apos;re live</h3>
                <p className="mb-6 text-gray-500">
                    Wholesalers get product listings with Jara offers, order management, real-time chat with
                    buyers, and revenue and Jara analytics — plus a capability retailers don&apos;t have: connecting
                    your own domain, so your storefront can run under your brand&apos;s own web address instead of
                    a myjara.com.ng subdomain.
                </p>
            </div>
        </div>
    )
}

export default function HowItWorksPage() {
    const [role, setRole] = useState<Role>('shopper')

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="relative overflow-hidden bg-emerald-950 py-24 text-white">
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <h1 className="mb-6 text-4xl font-extrabold md:text-6xl">
                        How <span className="text-emerald-400">MyJara</span> Works
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-emerald-100/80 md:text-xl">
                        A marketplace of independent Nigerian stores, where every purchase can come with a little
                        extra. Here&apos;s exactly how it works, whichever side of the counter you&apos;re on.
                    </p>
                </div>
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
            </section>

            {/* Jara calculator */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                            See a Jara bonus calculate live
                        </h2>
                        <p className="mx-auto max-w-2xl text-gray-500">
                            Every seller sets their own &quot;Buy X, Get Y&quot; rule per product. Try the exact
                            formula MyJara uses at checkout.
                        </p>
                    </div>
                    <div className="mx-auto max-w-2xl">
                        <JaraCalculator />
                    </div>
                </div>
            </section>

            {/* Role tabs */}
            <section className="bg-gray-50 py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-12 flex flex-wrap justify-center gap-3">
                        {ROLE_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setRole(tab.id)}
                                className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors ${
                                    role === tab.id
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {role === 'shopper' && <ShopperSection />}
                    {role === 'retailer' && <RetailerSection />}
                    {role === 'wholesaler' && <WholesalerSection />}
                </div>
            </section>

            {/* Trust & payments */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Payments & Support</h2>
                        <p className="text-gray-500">How money moves, and what happens if something goes wrong.</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                <CreditCard className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">Pay your way</h3>
                            <p className="text-gray-500">
                                Card, bank transfer, USSD, or mobile money, all processed through Flutterwave.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                <MessageCircle className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">Talk to a real seller</h3>
                            <p className="text-gray-500">
                                Every store has live chat — ask before you buy, or get support after.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">Disputes get resolved</h3>
                            <p className="text-gray-500">
                                Flag an order or a conversation and our team steps in to sort it out.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-gray-50 py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Frequently asked</h2>
                    </div>
                    <div className="mx-auto max-w-3xl">
                        <Accordion
                            items={FAQ_ITEMS.map((item) => ({
                                title: item.q,
                                content: <p className="leading-relaxed">{item.a}</p>,
                            }))}
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="mb-8 text-3xl font-bold">Ready to experience Jara?</h2>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button size="lg" className="rounded-full px-8" asChild>
                            <Link href="/search">Start Shopping</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                            <Link href="/register/seller">
                                Start Selling <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
