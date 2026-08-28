import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

import type { Database } from './database.types'

/** Routes that require a session. */
const PROTECTED_PREFIXES = ['/dashboard', '/isq', '/onboarding']

/** Routes that a signed-in user should be bounced away from. */
const AUTH_ROUTES = ['/login', '/sign-up']

/**
 * Refreshes the Supabase session cookie on every request and enforces the
 * onboarding order: complete your profile, then take the ISQ, then the
 * dashboard opens.
 *
 * The forwarding is deliberately one-directional. Once a user has a risk
 * profile they may still visit /isq to retake the questionnaire -- we only
 * push people forward past steps they have not finished, never back from
 * steps they have.
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

  // Do not insert logic between createServerClient and getUser: getUser()
  // revalidates the token, and anything in between risks a stale session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const [{ data: profile }, { data: riskProfile }] = await Promise.all([
    supabase.from('users').select('username, contact, occupation').eq('id', user.id).maybeSingle(),
    supabase.from('risk_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  const profileComplete = Boolean(profile?.username && profile.contact && profile.occupation)

  if (!profileComplete) {
    return path === '/onboarding/profile' ? supabaseResponse : redirectTo(request, '/onboarding/profile')
  }

  if (!riskProfile) {
    return path === '/isq' ? supabaseResponse : redirectTo(request, '/isq')
  }

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
