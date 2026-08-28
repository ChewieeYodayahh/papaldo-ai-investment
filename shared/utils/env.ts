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

/** Origin used to build absolute redirect URLs for the OAuth round trip. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}
