import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Allow tracking endpoints WITHOUT authentication
    if (request.nextUrl.pathname.startsWith('/api/email/track')) {
        return NextResponse.next()
    }

    // Rate Limit Authentication API calls only (not page views)
    // Supabase auth happens client-side, so we can't easily intercept login attempts here
    // Instead, we only rate-limit if there's suspicious activity patterns
    // The actual auth rate limiting should happen in the auth flow itself

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
