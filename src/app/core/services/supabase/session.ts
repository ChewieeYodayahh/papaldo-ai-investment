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
  /** Full name from the identity provider (Google), when it supplied one. */
  fullName: string | null
  /** Provider avatar URL, when it supplied one. */
  avatarUrl: string | null
  /** Supabase's id for this login. New on every sign-in; survives token refresh. */
  sessionId: string | null
  /** Unix seconds of the sign-in itself (from `amr`), not of the latest token refresh. */
  signedInAt: number | null
  /**
   * How this session was authenticated, from the signed `amr` claim: e.g.
   * `password`, `oauth`, or `recovery` after an emailed reset link.
   */
  authMethods: AuthMethod[]
  /** Identity providers linked to the account (`app_metadata.providers`), e.g. `email`, `google`. */
  providers: string[]
}

export type AuthMethod = { method: string; timestamp: number }

function authMethods(amr: unknown): AuthMethod[] {
  if (!Array.isArray(amr)) return []
  return amr.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const { method, timestamp } = entry as { method?: unknown; timestamp?: unknown }
    return typeof method === 'string' && typeof timestamp === 'number' ? [{ method, timestamp }] : []
  })
}

/** Earliest authentication timestamp in the JWT's `amr` claim, if any. */
function signedInAt(methods: AuthMethod[]): number | null {
  return methods.length ? Math.min(...methods.map((m) => m.timestamp)) : null
}

function providers(appMetadata: unknown): string[] {
  if (!appMetadata || typeof appMetadata !== 'object') return []
  const list = (appMetadata as { providers?: unknown }).providers
  return Array.isArray(list) ? list.filter((p): p is string => typeof p === 'string') : []
}

function metadataString(metadata: unknown, ...keys: string[]): string | null {
  if (!metadata || typeof metadata !== 'object') return null
  for (const key of keys) {
    const value = (metadata as Record<string, unknown>)[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null

  // user_metadata rides in the signed JWT, so reading it here costs nothing
  // extra. Email sign-ups have none; Google fills both fields.
  const metadata = data.claims.user_metadata
  const methods = authMethods(data.claims.amr)
  return {
    id: data.claims.sub,
    email: typeof data.claims.email === 'string' ? data.claims.email : null,
    fullName: metadataString(metadata, 'full_name', 'name'),
    avatarUrl: metadataString(metadata, 'avatar_url', 'picture'),
    sessionId: typeof data.claims.session_id === 'string' ? data.claims.session_id : null,
    signedInAt: signedInAt(methods),
    authMethods: methods,
    providers: providers(data.claims.app_metadata),
  }
})

/** The signed-in user's id, or null. Sugar over the common case. */
export async function getSessionUserId(): Promise<string | null> {
  return (await getSessionUser())?.id ?? null
}
