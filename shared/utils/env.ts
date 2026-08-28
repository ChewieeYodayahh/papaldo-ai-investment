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
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'
  return required('NEXT_PUBLIC_SITE_URL')
}
