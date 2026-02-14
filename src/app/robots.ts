import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://myjara.com.ng'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/dashboard/', // Generic dashboard routes
                '/customer/dashboard/',
                '/seller/dashboard/',
                '/auth/', // Auth callbacks etc
                '/api/', // API routes
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
