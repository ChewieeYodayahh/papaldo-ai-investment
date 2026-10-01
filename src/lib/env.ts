/**
 * Environment access. Every value is read from process.env at call time and
 * validated, so a missing variable fails loudly at startup instead of
 * surfacing as a confusing 401 from Supabase later.
 *
 * Nothing here is ever hardcoded -- see .env.example for the required keys.
 */
function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    )
  }
  return value
}

export function supabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL')
}

export function supabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Origin used to build absolute redirect URLs for the OAuth round trip.
 *
 * Falls back to localhost only in development; outside development a missing
 * value fails loudly like the Supabase keys, rather than silently producing a
 * broken production redirect.
 *
 * This value only builds redirect URLs. It does not choose the port the dev
 * server listens on -- `next dev` never reads it. The port is pinned in the
 * package.json scripts (`--port 3001`), and the two have to agree.
 *
 * `requestOrigin` is the origin the current request arrived on. It is what
 * kept Google sign-in alive on Vercel: without it this threw, the route
 * answered a bare HTTP 500, and the button reported a network error
 * (2026-09-26).
 *
 * The request origin now comes first (2026-10-01). Sign-in uses PKCE: the
 * code verifier is a cookie on the host the user started from, and vercel.app
 * hosts never share cookies, so a callback on any other host -- the old alias,
 * the new domain, the team URL -- cannot finish the exchange. The configured
 * value is only the fallback when there is no request. (The 2026-09-30
 * "vercel.com/login" landing was Supabase's Site URL pointing at the
 * Vercel-protected team URL, not this function; `VERCEL_PROJECT_PRODUCTION_URL`
 * was dropped because it can name that same protected URL.) The result never
 * ends in a slash, so `${siteUrl()}/path` cannot produce `//path`.
 */
export function siteUrl(requestOrigin?: string): string {
  if (requestOrigin) return trimSlash(requestOrigin)
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return trimSlash(configured)
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3001'
  return required('NEXT_PUBLIC_SITE_URL')
}

const trimSlash = (url: string) => url.replace(/\/+$/, '')
