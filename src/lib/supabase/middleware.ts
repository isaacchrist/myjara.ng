import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser()

    // Handle subdomain routing for brand stores
    const hostname = request.headers.get('host') || ''
    const url = request.nextUrl.clone()

    // Skip subdomain logic entirely for Vercel preview/production URLs and localhost
    const isVercelUrl = hostname.includes('.vercel.app') || hostname.includes('.vercel.sh')
    const isLocalhost = hostname.includes('localhost')

    // Only attempt subdomain routing for actual custom domains (e.g., brandname.myjara.com)
    // This requires the hostname to be a subdomain of myjara.com (not Vercel URLs)
    if (!isVercelUrl && !isLocalhost && hostname.includes('myjara.com')) {
        const parts = hostname.split('.')
        // e.g., brandname.myjara.com has 3 parts, www.myjara.com should be skipped
        if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'admin') {
            const subdomain = parts[0]
            // Rewrite to brand store page
            url.pathname = `/store/${subdomain}${url.pathname}`
            return NextResponse.rewrite(url, {
                headers: supabaseResponse.headers,
            })
        }
    }

    // Protect dashboard routes
    if (url.pathname.startsWith('/dashboard')) {
        if (!user) {
            url.pathname = '/login'
            url.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }
    }

    // Protect admin routes (except for the login page)
    // Admin uses a separate cookie-based auth, not Supabase user auth
    if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
        const adminCookie = request.cookies.get('myjara_admin_session')
        if (!adminCookie || adminCookie.value !== 'true') {
            url.pathname = '/admin/login'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
