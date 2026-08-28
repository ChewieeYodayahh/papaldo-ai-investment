import 'server-only'

import { createClient } from '@/shared/supabase/server'

import type { OnboardingStep, UserProfile } from '../types'
import { completeProfileSchema, type CompleteProfileInput } from '../schema'

/** Reads the signed-in user's profile row, or null if there is no session. */
export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id, email, username, contact, occupation')
    .eq('id', user.id)
    .maybeSingle()

  return data ?? null
}

export function isProfileComplete(profile: Pick<UserProfile, 'username' | 'contact' | 'occupation'> | null) {
  return Boolean(profile?.username && profile.contact && profile.occupation)
}

/**
 * Decides where a signed-in user belongs: finish the profile, take the ISQ,
 * or go to the dashboard. The middleware enforces the same order.
 */
export async function resolveOnboardingStep(): Promise<OnboardingStep> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'complete-profile'

  const [{ data: profile }, { data: riskProfile }] = await Promise.all([
    supabase.from('users').select('username, contact, occupation').eq('id', user.id).maybeSingle(),
    supabase.from('risk_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  if (!isProfileComplete(profile)) return 'complete-profile'
  if (!riskProfile) return 'isq'
  return 'dashboard'
}

/** Fills in the fields Google sign-in cannot supply. */
export async function updateProfile(input: CompleteProfileInput) {
  const parsed = completeProfileSchema.parse(input)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, message: 'You are not signed in.' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      username: parsed.username,
      contact: parsed.contact,
      occupation: parsed.occupation,
    })
    .eq('id', user.id)

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
