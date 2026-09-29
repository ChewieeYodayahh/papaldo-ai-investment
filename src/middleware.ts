import type { NextRequest } from 'next/server'

import { updateSession } from '@/app/core/services/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

/**
 * Only the routes that actually need a session.
 *
 * This used to match everything but static assets, so the landing page,
 * `/markets` and every symbol page paid for a session check they never read.
 * On a prerendered page like `/login` that was the entire server cost of the
 * request.
 *
 * What stays: the protected prefixes the middleware guards, and the auth
 * routes it bounces signed-in users away from. Nothing else reads the result.
 * Adding a new protected route means adding it here *and* to
 * PROTECTED_PREFIXES in core/services/supabase/middleware.ts -- the two lists
 * are deliberately separate (one decides where the middleware runs, the other
 * what it enforces) and they have to be changed together.
 */
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portfolio/:path*',
    '/isq/:path*',
    '/onboarding/:path*',
    '/profile/:path*',
    '/tools/:path*',
    '/admin/:path*',
    '/login',
    '/sign-up',
  ],
}
