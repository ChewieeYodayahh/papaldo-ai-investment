import 'server-only'

import { cache } from 'react'

import { getUsdToPhp } from '@/app/core/services/exchange-rate'
import { getSessionUser } from '@/app/core/services/supabase/session'
import { getProfile } from '@/app/features/auth/api/profile'
import type { Fx } from '@/app/features/preferences/components/Money'
import { getOrderHistory } from '@/app/features/trading/api/orders'
import type { Order } from '@/app/features/trading/types'

import { greetingSeed } from '../greetings'

export type ShellUser = {
  displayName: string
  firstName: string
  email: string | null
  avatarUrl: string | null
  username: string | null
  occupation: string | null
}

export type ShellData = {
  user: ShellUser | null
  fx: Fx
  /** Recent simulated fills -- the only events Papaldo has to notify about. */
  notifications: Order[]
  /** Constant for one five-minute window of this session; see greetings.ts. */
  greetingSeed: number
}

const NOTIFICATION_COUNT = 8

/**
 * Everything the chrome around a page needs, in one parallel read.
 *
 * The name falls back from the identity provider's full name to the profile
 * username to the email's local part, so an email sign-up is still greeted by
 * something that looks like a name.
 *
 * The greeting seed is computed here from the session, not rolled in the
 * browser: the server and the first client render must agree on it.
 *
 * `cache()`d so a page that also wants the viewer's name shares this read
 * with the shell instead of repeating it.
 */
export const getShellData = cache(async (): Promise<ShellData> => {
  const session = await getSessionUser()

  const [profile, fx, notifications] = await Promise.all([
    session ? getProfile() : null,
    getUsdToPhp().then(
      (rate): Fx => ({ rate: rate.rate, asOf: rate.asOf }),
      (error: unknown): Fx => {
        console.error('[shell] USD->PHP rate unavailable:', error)
        return null
      },
    ),
    session ? getOrderHistory(NOTIFICATION_COUNT) : [],
  ])

  const user: ShellUser | null = session
    ? (() => {
        const displayName =
          session.fullName ?? profile?.username ?? session.email?.split('@')[0] ?? 'Investor'
        const first = displayName.split(/\s+/)[0]
        return {
          displayName,
          // Usernames are often lowercase; a greeting reads better capitalised.
          firstName: first.charAt(0).toUpperCase() + first.slice(1),
          email: session.email,
          avatarUrl: session.avatarUrl,
          username: profile?.username ?? null,
          occupation: profile?.occupation ?? null,
        }
      })()
    : null

  return {
    user,
    fx,
    notifications,
    greetingSeed: greetingSeed(session),
  }
})
