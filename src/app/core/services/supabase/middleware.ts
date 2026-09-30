import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

import type { Database } from './database.types'

/** Routes that require a session. Keep in step with the matcher in src/middleware.ts. */
// /tools itself and the calculators are open to guests (Carlos, 2026-09-30);
// only the export reads account data. The /tools matcher in src/middleware.ts
// stays, because this middleware is what refreshes the session cookie there.
const PROTECTED_PREFIXES = ['/dashboard', '/portfolio', '/isq', '/onboarding', '/profile', '/tools/export', '/admin', '/u/']

/** Routes that a signed-in user should be bounced away from. */
const AUTH_ROUTES = ['/login', '/sign-up']

/**
 * Refreshes the Supabase session cookie and enforces the one remaining
 * required step: have a username, then the dashboard opens.
 *
 * The forwarding is deliberately one-directional. `/isq` is always reachable,
 * whether or not it has been taken -- we only push people forward past steps
 * they have not finished, never back from steps they have.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        supabaseResponse = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options)
        }
      },
    },
  })

  // Do not insert logic between createServerClient and this call: it is what
  // refreshes the session, and anything in between risks a stale one.
  //
  // getClaims rather than getUser. It still calls getSession internally, so
  // an expiring token is still refreshed and the cookie still rotates -- but
  // it verifies the JWT locally against the project's cached JWKS instead of
  // asking /auth/v1/user. With Supabase in Seoul and functions in Washington
  // DC that round trip cost 0.6-1.0s on *every* request, including
  // prerendered pages that need nothing from it.
  const { data: claims } = await supabase.auth.getClaims()
  const user = claims?.claims?.sub ? { id: claims.claims.sub } : null

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
  const isAuthRoute = AUTH_ROUTES.includes(path)

  if (!user) {
    if (isProtected) {
      return redirectTo(request, '/login')
    }
    return supabaseResponse
  }

  if (!isProtected && !isAuthRoute) {
    return supabaseResponse
  }

  const { data: profile } = await supabase.from('users').select('username').eq('id', user.id).maybeSingle()

  // Only a username is required -- the app cannot address a user without one,
  // and a first Google sign-in is the only way to arrive without it. Contact,
  // occupation and income are the optional setup journey (Get Started 1/3)
  // since 2026-09-26, and the questionnaire stopped being a gate on
  // 2026-09-11. Both are invitations, not redirects.
  if (!profile?.username) {
    return path === '/onboarding/profile' ? supabaseResponse : redirectTo(request, '/onboarding/profile')
  }

  // `/onboarding/profile` stays reachable once a username exists: it is the
  // setup journey, opened from the Get Started checklist.
  if (isAuthRoute) {
    return redirectTo(request, '/dashboard')
  }

  return supabaseResponse
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  return NextResponse.redirect(url)
}
