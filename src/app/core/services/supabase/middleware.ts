import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

import type { Database } from './database.types'

/** Routes that require a session. */
const PROTECTED_PREFIXES = ['/dashboard', '/portfolio', '/isq', '/onboarding']

/** Routes that a signed-in user should be bounced away from. */
const AUTH_ROUTES = ['/login', '/sign-up']

/**
 * Refreshes the Supabase session cookie and enforces the one remaining
 * required step: complete your profile, then the dashboard opens.
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

  const { data: profile } = await supabase
    .from('users')
    .select('username, contact, occupation')
    .eq('id', user.id)
    .maybeSingle()

  const profileComplete = Boolean(profile?.username && profile.contact && profile.occupation)

  if (!profileComplete) {
    return path === '/onboarding/profile' ? supabaseResponse : redirectTo(request, '/onboarding/profile')
  }

  // The questionnaire is no longer a gate. `/isq` stays reachable and the
  // dashboard invites people to it, but nobody is held there -- so this is the
  // only remaining forced step, and it exists because the app cannot address a
  // user it has no username for.
  if (isAuthRoute || path === '/onboarding/profile') {
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
