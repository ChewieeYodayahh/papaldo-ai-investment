import 'server-only'

import { cache } from 'react'

import { createClient } from './server'

/**
 * Who is signed in, resolved once per request.
 *
 * Two problems this solves, both measured 2026-09-11 with Supabase in Seoul
 * and Vercel functions in Washington DC:
 *
 * 1. `auth.getUser()` is a network round trip to `/auth/v1/user` on every
 *    call -- 0.6 to 1.0s across the Pacific. `auth.getClaims()` verifies the
 *    JWT locally against the project's cached JWKS instead, so the same
 *    answer costs no network at all. This project signs with ES256, which is
 *    what makes local verification possible; on a legacy HS256 project
 *    getClaims falls back to asking the server and this is merely no worse.
 *
 * 2. Four separate modules each asked independently, so one dashboard render
 *    paid that cost four times. `cache()` dedupes within a single render
 *    pass, so every caller after the first is free.
 *
 * This is still a *verified* identity, not a decoded one. `getClaims`
 * checks the signature; it does not trust the cookie the way `getSession`
 * does. Never swap this for `getSession().user`.
 */
export type SessionUser = {
  id: string
  email: string | null
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === 'string' ? data.claims.email : null,
  }
})

/** The signed-in user's id, or null. Sugar over the common case. */
export async function getSessionUserId(): Promise<string | null> {
  return (await getSessionUser())?.id ?? null
}
