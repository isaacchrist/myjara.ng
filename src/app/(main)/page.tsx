import Link from 'next/link'
import { ArrowRight, Gift, ShieldCheck, Truck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/marketplace/search-bar'
import { ProductCard } from '@/components/marketplace/product-card'
import { Badge } from '@/components/ui/badge'
import { MarketDayBanner } from '@/components/marketplace/market-day-banner'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Fetch Featured Products (Active, have Jara offer, limit 8)
  const { data: featuredProducts } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(name, slug),
      product_images(url, is_primary)
    `)
    .eq('status', 'active')
    .gt('jara_get_quantity', 0)
    .order('created_at', { ascending: false })
    .limit(8)

  // 2. Fetch Category Counts
  // We'll fetch all active product category_ids to count them
  const { data: productCategories } = await supabase
    .from('products')
    .select('category_id')
    .eq('status', 'active')

  const categoryCounts = ((productCategories as any[]) || []).reduce((acc: Record<string, number>, curr) => {
    const id = curr.category_id
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  // Map constants to display format
  const categories = PRODUCT_CATEGORIES.map(cat => ({
    name: cat.name,
    slug: cat.id,
    icon: cat.icon,
    count: categoryCounts[cat.id] || 0
  })).sort((a, b) => b.count - a.count).slice(0, 6) // Top 6 categories by count or just first 6

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

      {/* How Jara Works Teaser */}
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
          <div className="mt-10 text-center">
            <Link href="/how-jara-works" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Learn exactly how it works →
            </Link>
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

          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {featuredProducts.map((product: any) => {
                // Basic mapping to ensure product card gets necessary props
                // Note: product-card expects `product_images` array or we find primary info
                const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.url
                  || product.product_images?.[0]?.url

                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    jaraBuyQty={product.jara_buy_quantity}
                    jaraGetQty={product.jara_get_quantity}
                    storeName={product.store?.name}
                    storeSlug={product.store?.slug}
                    cities={[]} // Featured products on homepage might not show logistics city, or we fetch it if critical
                    imageUrl={primaryImage}
                  // Pass other props if needed
                  />
                )
              })}
            </div>
          ) : (
            <div className="mt-12 text-center text-gray-500 py-10 bg-gray-50 rounded-xl">
              <p>No featured products available at the moment.</p>
            </div>
          )}

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
                <h3 className="mt-3 font-medium text-gray-900 group-hover:text-emerald-600 dark:text-gray-200 dark:group-hover:text-emerald-500 text-center">
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
                <Link href="/register/retailer">
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
