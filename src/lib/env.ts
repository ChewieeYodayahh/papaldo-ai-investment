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
 * `requestOrigin` is the origin the current request arrived on. When the env
 * var is unset it is the right answer by definition, and it is what kept
 * Google sign-in alive on Vercel: without it this threw, the route answered a
 * bare HTTP 500, and the button reported a network error (2026-09-26). An
 * explicit NEXT_PUBLIC_SITE_URL still wins, e.g. behind a proxy that rewrites
 * the host.
 *
 * On Vercel's production deployment two more guards apply (2026-09-30, after
 * Google sign-in landed on vercel.com/login): a localhost value baked into the
 * build is ignored, and the project's production domain
 * (`VERCEL_PROJECT_PRODUCTION_URL`, set by Vercel) comes before the request
 * origin, which could be a deployment-specific URL behind Vercel
 * Authentication. The result never ends in a slash, so `${siteUrl()}/path`
 * cannot produce `//path`.
 */
export function siteUrl(requestOrigin?: string): string {
  const production = process.env.VERCEL_ENV === 'production'
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured && !(production && /\/\/(localhost|127\.0\.0\.1)\b/.test(configured))) return trimSlash(configured)
  if (production && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${trimSlash(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`
  }
  if (requestOrigin) return trimSlash(requestOrigin)
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3001'
  return required('NEXT_PUBLIC_SITE_URL')
}

const trimSlash = (url: string) => url.replace(/\/+$/, '')
