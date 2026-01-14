import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://myjara.com.ng'

    // Static pages
    const staticPages = [
        '',
        '/categories',
        '/markets',
        '/how-it-works',
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

    return staticRoutes
}
