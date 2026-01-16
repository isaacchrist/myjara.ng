import Link from 'next/link'
import { ArrowRight, Gift, ShieldCheck, Truck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/marketplace/search-bar'
import { ProductCard } from '@/components/marketplace/product-card'
import { Badge } from '@/components/ui/badge'
import { MarketDayBanner } from '@/components/marketplace/market-day-banner'

// Mock data for featured products
const featuredProducts = [
  {
    id: '1',
    name: 'Premium Basmati Rice (50kg)',
    price: 48000,
    jaraBuyQty: 5,
    jaraGetQty: 1,
    storeName: 'FoodMart Nigeria',
    storeSlug: 'foodmart',
    cities: ['Lagos', 'Abuja'],
  },
  {
    id: '2',
    name: 'Wireless Bluetooth Earbuds Pro',
    price: 15000,
    jaraBuyQty: 10,
    jaraGetQty: 2,
    storeName: 'TechZone',
    storeSlug: 'techzone',
    cities: ['Lagos', 'Port Harcourt'],
  },
  {
    id: '3',
    name: 'Organic Shea Butter (500g)',
    price: 3500,
    jaraBuyQty: 3,
    jaraGetQty: 1,
    storeName: 'NaturalGlow',
    storeSlug: 'naturalglow',
    cities: ['Kano', 'Kaduna'],
  },
  {
    id: '4',
    name: 'Men\'s Casual Polo Shirt',
    price: 8500,
    jaraBuyQty: 4,
    jaraGetQty: 1,
    storeName: 'StyleHub',
    storeSlug: 'stylehub',
    cities: ['Lagos', 'Ibadan'],
  },
]

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: '📱', count: 234 },
  { name: 'Fashion', slug: 'fashion', icon: '👕', count: 567 },
  { name: 'Food & Groceries', slug: 'food-groceries', icon: '🍎', count: 891 },
  { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄', count: 345 },
  { name: 'Home & Garden', slug: 'home-garden', icon: '🏠', count: 234 },
  { name: 'Sports', slug: 'sports-outdoors', icon: '⚽', count: 123 },
]

export default function HomePage() {
  return (
    <div>
      <MarketDayBanner />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="jara" className="mb-6 text-sm border-emerald-800 bg-emerald-950/50 text-emerald-100 hover:bg-emerald-900/50">
              🎁 Buy More, Get More — It's Jara!
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Discover Products.
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Enjoy More.
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-300 md:text-xl">
              Nigeria's marketplace where you always get extra.
              Shop across hundreds of brands and enjoy <strong className="text-emerald-400">Jara</strong> —
              bonus products with every qualifying purchase.
            </p>

            <div className="mt-10">
              <SearchBar showFilters={false} />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Store className="h-4 w-4" /> 500+ Brands
              </span>
              <span className="flex items-center gap-1">
                <Gift className="h-4 w-4" /> 10,000+ Jara Offers
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" /> Nationwide Delivery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How Jara Works */}
      <section className="border-y border-gray-100 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-2xl dark:bg-emerald-900/30">
                🔍
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Search Products</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Find what you need across all brands in one place
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl dark:bg-amber-900/30">
                🎁
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">See the Jara</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Every product shows its Jara offer — buy X, get Y free
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-2xl dark:bg-teal-900/30">
                🛒
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Enjoy More</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Complete your purchase and receive your bonus items
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                Featured Products
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Discover products with the best Jara offers
              </p>
            </div>
            <Link
              href="/search"
              className="hidden items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 md:flex"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
              />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/search">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            Shop by Category
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/search?category=${category.slug}`}
                className="group flex flex-col items-center rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:bg-gray-950 dark:border dark:border-gray-800"
              >
                <span className="text-4xl">{category.icon}</span>
                <h3 className="mt-3 font-medium text-gray-900 group-hover:text-emerald-600 dark:text-gray-200 dark:group-hover:text-emerald-500">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  {category.count} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Brands CTA */}
      <section className="py-16 dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 md:p-12 dark:from-emerald-900 dark:to-teal-900">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Own a Brand? Sell on MyJara
                </h2>
                <p className="mt-3 max-w-xl text-emerald-100 dark:text-emerald-200">
                  Join hundreds of Nigerian brands using Jara to attract customers
                  and boost sales. Get your own storefront and start selling today.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-emerald-100 dark:text-emerald-200 md:justify-start">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> No upfront fees
                  </span>
                  <span className="flex items-center gap-1">
                    <Store className="h-4 w-4" /> Your own store page
                  </span>
                  <span className="flex items-center gap-1">
                    <Gift className="h-4 w-4" /> You control your Jara
                  </span>
                </div>
              </div>
              <Button
                size="lg"
                className="shrink-0 bg-white text-emerald-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-emerald-500 dark:hover:bg-gray-800"
                asChild
              >
                <Link href="/register/brand">
                  Start Selling
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
