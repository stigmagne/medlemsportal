import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Allow tracking endpoints WITHOUT authentication
    if (request.nextUrl.pathname.startsWith('/api/email/track')) {
        return NextResponse.next()
    }

    // Rate Limit Authentication Pages (Login/Signup)
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
        // Only run on GET requests to protect page load, or POST if we had server actions here
        // Since it's client-side auth, we protect the page serving itself to prevent automated scraping/spam
        const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1'
        try {
            // Dynamic import to avoid edge runtime issues if lib uses non-edge APIs
            // (though upstash is edge-safe, this is safer pattern)
            const { checkRateLimit, RateLimitStrategy } = await import('./lib/rate-limit')
            const result = await checkRateLimit(RateLimitStrategy.AUTH, ip)

            if (!result.success) {
                return new NextResponse('Too Many Requests', {
                    status: 429,
                    headers: {
                        'Retry-After': result.retryAfter?.toString() || '60'
                    }
                })
            }
        } catch (e) {
            console.error('Rate limit error:', e)
            // Fail open
        }
    }

    try {
        return await updateSession(request)
    } catch (e) {
        console.error('Middleware Error:', e)
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
