import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'
import { ABUJA_MARKETS } from '@/lib/constants'

// Initialize Supabase Client (no auth needed for public data)
const supabase = createClient()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://myjara.com.ng'

    // 1. Static Routes
    const staticPages = [
        '',
        '/categories',
        '/markets',
        '/how-it-works',
        '/how-jara-works',
        '/contact',
        '/help',
        '/support',
        '/login',
        '/register',
        '/register/retailer',
        '/register/seller',
    ]

    const staticRoutes = staticPages.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))


    // 2. Dynamic Routes: Stores
    // Fetch all verified stores
    const { data: storesData } = await supabase
        .from('stores')
        .select('slug, updated_at')
        .eq('is_verified', true)
        .order('updated_at', { ascending: false })
        .limit(1000)

    const stores = storesData as any[]

    const storeRoutes = (stores || []).map((store: any) => ({
        url: `${baseUrl}/store/${store.slug}`,
        lastModified: new Date(store.updated_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }))

    // 3. Dynamic Routes: Products
    // Fetch active products
    const { data: productsData } = await supabase
        .from('products')
        .select('id, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5000)

    const products = productsData as any[]

    const productRoutes = (products || []).map((product: any) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }))

    // 4. Dynamic Routes: Markets
    const marketRoutes = ABUJA_MARKETS.map((market) => {
        const slug = market.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        return {
            url: `${baseUrl}/market/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }
    })

    return [...staticRoutes, ...storeRoutes, ...productRoutes, ...marketRoutes]
}
