import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import { siteUrl } from '@/lib/env'

/**
 * Builds the Google consent URL server-side.
 *
 * `skipBrowserRedirect` keeps the Supabase call out of the browser: the button
 * POSTs here, gets a URL back as JSON, and navigates itself. That preserves
 * the rule that no component talks to Supabase directly, while still using
 * stock Supabase Auth rather than a hand-rolled OAuth flow.
 */
export async function getGoogleAuthUrl(): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      skipBrowserRedirect: true,
      redirectTo: `${siteUrl()}/api/auth/callback`,
    },
  })

  if (error || !data.url) {
    return { ok: false, message: error?.message ?? 'Could not start Google sign-in.' }
  }

  return { ok: true, url: data.url }
}

/** Exchanges the `?code=` from Google's redirect for a session cookie. */
export async function exchangeCodeForSession(code: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return error ? { ok: false as const, message: error.message } : { ok: true as const }
}
