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

    // Check if this is a brand subdomain (e.g., brandname.myjara.com)
    const isLocalhost = hostname.includes('localhost')
    const mainDomain = isLocalhost ? 'localhost:3000' : 'myjara.com'

    if (!hostname.includes(mainDomain) || hostname.split('.').length > (isLocalhost ? 1 : 2)) {
        // This might be a brand subdomain - extract brand slug
        const subdomain = hostname.split('.')[0]

        if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
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

    // Protect admin routes
    if (url.pathname.startsWith('/admin')) {
        if (!user) {
            url.pathname = '/login'
            url.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }
        // Additional admin role check would be done in the page/layout
    }

    return supabaseResponse
}
