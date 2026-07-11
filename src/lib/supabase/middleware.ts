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

    // Handle subdomain + connected custom-domain routing for stores
    const hostname = (request.headers.get('host') || '').split(':')[0]
    const url = request.nextUrl.clone()

    // Skip routing entirely for Vercel preview/production URLs and localhost
    const isVercelUrl = hostname.includes('.vercel.app') || hostname.includes('.vercel.sh')
    const isLocalhost = hostname.includes('localhost')
    // The canonical platform domain -- kept in one place since email/subscription
    // links elsewhere already standardize on myjara.ng.
    const rootDomain = 'myjara.ng'

    if (!isVercelUrl && !isLocalhost) {
        if (hostname.endsWith(`.${rootDomain}`)) {
            const subdomain = hostname.slice(0, -(rootDomain.length + 1))
            if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
                url.pathname = `/store/${subdomain}${url.pathname}`
                return NextResponse.rewrite(url, {
                    headers: supabaseResponse.headers,
                })
            }
        } else if (hostname !== rootDomain) {
            // Not our root domain or a subdomain of it -- check whether it's a
            // verified custom domain connected via store_domains (Phase 2.2).
            const { data: domainRow } = await supabase
                .from('store_domains')
                .select('store:stores(slug)')
                .eq('domain', hostname)
                .eq('is_verified', true)
                .single()

            const slug = (domainRow as any)?.store?.slug
            if (slug) {
                url.pathname = `/store/${slug}${url.pathname}`
                return NextResponse.rewrite(url, {
                    headers: supabaseResponse.headers,
                })
            }
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

    // Protect seller routes & Check Subscription
    if (url.pathname.startsWith('/seller')) {
        if (!user) {
            url.pathname = '/login'
            url.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        // Check subscription expiry
        // Optimization: We could use cached valid status in cookie, but for now query DB
        if (!url.pathname.startsWith('/seller/subscription')) {
            const { data: store } = await supabase
                .from('stores')
                .select('subscription_expiry')
                .eq('owner_id', user.id)
                .single()

            if (store?.subscription_expiry) {
                const expiry = new Date(store.subscription_expiry)
                if (expiry < new Date()) {
                    url.pathname = '/seller/subscription'
                    return NextResponse.redirect(url)
                }
            }
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
