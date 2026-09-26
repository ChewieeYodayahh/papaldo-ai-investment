import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUser } from '@/app/core/services/supabase/session'
import { siteUrl } from '@/lib/env'

import { passwordChangeSchema, type PasswordChangeInput } from '../schema'
import { setReturnTo } from './return-to'

/**
 * Password change, confirmed by email.
 *
 * Step 1 (`sendPasswordConfirmation`) mails a Supabase recovery link to the
 * account's own address. Opening it runs `/api/auth/callback`, which trades
 * the link's code for a fresh session whose signed `amr` claim records the
 * method `recovery`, then returns to the profile page.
 *
 * Step 2 (`changePassword`) only succeeds inside that window. The check reads
 * the verified JWT, so a signed-in session that never opened the email -- a
 * borrowed laptop, a stolen cookie -- cannot set a new password.
 *
 * Why not `reauthenticate()` + nonce: Supabase verifies that nonce only when
 * "Secure password change" is on *and* the session is over 24h old, so the
 * app could not rely on it to prove anything.
 */

/** How long after opening the email the new password may be set. */
export const CONFIRMATION_WINDOW_SECONDS = 15 * 60

export async function sendPasswordConfirmation() {
  const user = await getSessionUser()
  if (!user?.email) {
    return { ok: false as const, message: 'You are not signed in.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${siteUrl()}/api/auth/callback`,
  })
  if (error) {
    return { ok: false as const, message: error.message }
  }

  await setReturnTo('/profile?security=confirmed')
  return { ok: true as const, email: user.email }
}

/** True when this session was opened from the confirmation email recently enough. */
export async function hasConfirmedByEmail(): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) return false
  const now = Math.floor(Date.now() / 1000)
  return user.authMethods.some(
    (entry) => entry.method === 'recovery' && now - entry.timestamp <= CONFIRMATION_WINDOW_SECONDS,
  )
}

export async function changePassword(input: PasswordChangeInput) {
  const parsed = passwordChangeSchema.parse(input)

  if (!(await hasConfirmedByEmail())) {
    return {
      ok: false as const,
      message: 'Open the confirmation link we emailed you first, then set your new password within 15 minutes.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.password })
  if (error) {
    return { ok: false as const, message: error.message, fieldErrors: { password: error.message } }
  }
  return { ok: true as const }
}
