import 'server-only'

import { cache } from 'react'

import { getUsdToPhp } from '@/app/core/services/exchange-rate'
import { getSessionUser } from '@/app/core/services/supabase/session'
import { getProfile, isSetupComplete } from '@/app/features/auth/api/profile'
import { isAdmin } from '@/app/features/auth/api/roles'
import { getCurrentRiskProfile } from '@/app/features/tools/quiz/api/submit'
import type { Fx } from '@/app/features/userData/preferences/components/Money'
import { getOrderHistory } from '@/app/features/trading/api/orders'
import type { Order } from '@/app/features/trading/types'
import type { SetupProgress } from '@/app/features/tutorials/types'

import { greetingSeed } from '../greetings'

export type ShellUser = {
  displayName: string
  firstName: string
  email: string | null
  avatarUrl: string | null
  username: string | null
  occupation: string | null
  /** Offers the Developer Dashboard link; the database checks again on every read. */
  isAdmin: boolean
}

export type ShellData = {
  user: ShellUser | null
  fx: Fx
  /** Recent simulated fills -- the only events Papaldo has to notify about. */
  notifications: Order[]
  /** Constant for one five-minute window of this session; see greetings.ts. */
  greetingSeed: number
  /** Null when signed out. */
  setup: SetupProgress | null
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
/**
 * The signed-in user as the chrome shows them, or null. Just the session, the
 * profile row and the role -- light enough for the landing page, which needs
 * the account pill but none of the dashboard data.
 *
 * The name falls back from the identity provider's full name to the profile
 * username to the email's local part, so an email sign-up is still greeted by
 * something that looks like a name.
 */
export const getShellUser = cache(async (): Promise<ShellUser | null> => {
  const session = await getSessionUser()
  if (!session) return null

  const [profile, admin] = await Promise.all([getProfile(), isAdmin()])
  const displayName = session.fullName ?? profile?.username ?? session.email?.split('@')[0] ?? 'Investor'
  const first = displayName.split(/\s+/)[0]
  return {
    displayName,
    // Usernames are often lowercase; a greeting reads better capitalised.
    firstName: first.charAt(0).toUpperCase() + first.slice(1),
    email: session.email,
    avatarUrl: session.avatarUrl,
    username: profile?.username ?? null,
    occupation: profile?.occupation ?? null,
    isAdmin: admin,
  }
})

/**
 * Everything the chrome around a page needs, in one parallel read.
 *
 * The greeting seed is computed here from the session, not rolled in the
 * browser: the server and the first client render must agree on it.
 *
 * `cache()`d so a page that also wants the viewer's name shares this read
 * with the shell instead of repeating it.
 */
export const getShellData = cache(async (): Promise<ShellData> => {
  const session = await getSessionUser()

  const [user, profile, fx, notifications, riskProfile] = await Promise.all([
    getShellUser(),
    session ? getProfile() : null,
    getUsdToPhp().then(
      (rate): Fx => ({ rate: rate.rate, asOf: rate.asOf }),
      (error: unknown): Fx => {
        console.error('[shell] USD->PHP rate unavailable:', error)
        return null
      },
    ),
    session ? getOrderHistory(NOTIFICATION_COUNT) : [],
    session ? getCurrentRiskProfile() : null,
  ])

  return {
    user,
    fx,
    notifications,
    greetingSeed: greetingSeed(session),
    setup: session
      ? { profile: isSetupComplete(profile), quiz: Boolean(riskProfile), trade: notifications.length > 0 }
      : null,
  }
})
