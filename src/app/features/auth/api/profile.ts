import 'server-only'

import { cache } from 'react'

import type { TablesUpdate } from '@/app/core/services/supabase/database.types'
import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUser } from '@/app/core/services/supabase/session'

import type { OnboardingStep, UserProfile } from '../types'
import { profileUpdateSchema, type Income, type IncomeCurrency, type ProfileUpdateInput } from '../schema'

const PROFILE_COLUMNS =
  'id, email, username, contact, occupation, occupations, annual_income, annual_income_currency, ideal_income, ideal_income_currency, avatar_url, website, is_private'

function toIncome(amount: number | null, currency: string | null): Income | null {
  return amount === null || !currency ? null : { amount: Number(amount), currency: currency as IncomeCurrency }
}

/**
 * Reads the signed-in user's profile row, or null if there is no session.
 * `cache()`d: the shell, the dashboard and the profile page all ask.
 */
export const getProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase.from('users').select(PROFILE_COLUMNS).eq('id', user.id).maybeSingle()
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    contact: data.contact,
    // occupations is the source now; occupation is its first entry until dropped.
    occupation: data.occupations[0] ?? data.occupation,
    occupations: data.occupations.length ? data.occupations : data.occupation ? [data.occupation] : [],
    annualIncome: toIncome(data.annual_income, data.annual_income_currency),
    idealIncome: toIncome(data.ideal_income, data.ideal_income_currency),
    avatarUrl: data.avatar_url,
    website: data.website,
    isPrivate: data.is_private,
  }
})

/**
 * Whether the app can address this user at all. A username is the one thing
 * still required up front (middleware enforces it); a first Google sign-in is
 * the only way to arrive without one.
 */
export function hasUsername(profile: Pick<UserProfile, 'username'> | null): boolean {
  return Boolean(profile?.username)
}

/**
 * Get Started 1/3: every profile field the setup journey asks for is filled.
 * Optional -- it drives a checklist tick, never a redirect.
 */
export function isSetupComplete(profile: UserProfile | null): boolean {
  return Boolean(
    profile?.username && profile.contact && profile.occupation && profile.annualIncome && profile.idealIncome,
  )
}

/**
 * Decides where a signed-in user belongs: pick a username, or go to the
 * dashboard. The middleware enforces the same rule.
 */
export async function resolveOnboardingStep(): Promise<OnboardingStep> {
  const user = await getSessionUser()
  if (!user) return 'complete-profile'

  const supabase = await createClient()
  const { data: profile } = await supabase.from('users').select('username').eq('id', user.id).maybeSingle()

  // Neither the risk profile nor the optional setup fields are consulted:
  // both are invitations on the dashboard, not reasons to send someone away.
  return hasUsername(profile) ? 'dashboard' : 'complete-profile'
}

/** Saves any subset of the editable profile. Undefined fields are left alone. */
export async function updateProfile(input: ProfileUpdateInput) {
  const parsed = profileUpdateSchema.parse(input)
  const user = await getSessionUser()
  if (!user) {
    return { ok: false as const, message: 'You are not signed in.' }
  }

  const patch: TablesUpdate<'users'> = {}
  if (parsed.username !== undefined) patch.username = parsed.username
  if (parsed.contact !== undefined) patch.contact = parsed.contact
  // Both columns stay in step until occupation is dropped (migration B).
  if (parsed.occupations !== undefined) {
    patch.occupations = parsed.occupations
    patch.occupation = parsed.occupations[0] ?? null
  } else if (parsed.occupation !== undefined) {
    patch.occupation = parsed.occupation
    patch.occupations = [parsed.occupation]
  }
  if (parsed.website !== undefined) patch.website = parsed.website
  if (parsed.isPrivate !== undefined) patch.is_private = parsed.isPrivate
  if (parsed.annualIncome !== undefined) {
    patch.annual_income = parsed.annualIncome?.amount ?? null
    patch.annual_income_currency = parsed.annualIncome?.currency ?? null
  }
  if (parsed.idealIncome !== undefined) {
    patch.ideal_income = parsed.idealIncome?.amount ?? null
    patch.ideal_income_currency = parsed.idealIncome?.currency ?? null
  }

  const supabase = await createClient()
  const { error } = await supabase.from('users').update(patch).eq('id', user.id)

  if (error) {
    // 23505 is unique_violation on users_username_lower_key.
    if (error.code === '23505') {
      return {
        ok: false as const,
        message: 'That username is already taken.',
        fieldErrors: { username: 'That username is already taken.' },
      }
    }
    return { ok: false as const, message: error.message }
  }

  return { ok: true as const }
}
