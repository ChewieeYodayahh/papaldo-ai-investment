import 'server-only'

import { cookies } from 'next/headers'

/**
 * Where `/api/auth/callback` should land after an emailed link or an
 * identity-link round trip, carried in a short-lived cookie rather than a
 * `?next=` on the redirect URL.
 *
 * Why a cookie: Supabase only redirects to URLs on the project's allow list,
 * and the callback URL is already on it for Google sign-in. A query string
 * would need its own allow-list entry per destination. The PKCE verifier for
 * these flows lives in a cookie on the same browser anyway, so a link opened
 * elsewhere fails either way.
 */
const COOKIE = 'papaldo_return_to'

/** Only in-app paths, and only ones that start a flow. Never an open redirect. */
const ALLOWED = ['/profile']

export async function setReturnTo(path: string) {
  if (!isAllowedReturnPath(path)) throw new Error(`Refusing to store return path ${path}`)
  const store = await cookies()
  store.set(COOKIE, path, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 30 })
}

/** Reads and clears the stored path. Null when absent, expired or not allowed. */
export async function takeReturnTo(): Promise<string | null> {
  const store = await cookies()
  const value = store.get(COOKIE)?.value ?? null
  if (value) store.delete(COOKIE)
  return value && isAllowedReturnPath(value) ? value : null
}

/** In-app, allow-listed pathname; rejects absolute and protocol-relative URLs. */
export function isAllowedReturnPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false
  const pathname = path.split(/[?#]/)[0]
  return ALLOWED.includes(pathname)
}
