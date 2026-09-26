import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'

import type { AuthResult } from '../types'
import { signUpSchema, type SignUpInput } from '../schema'

/**
 * Email/password registration.
 *
 * The profile row is created by the `handle_new_user` trigger from the
 * metadata passed here, so the username lands in public.users without a
 * second round trip. Contact and occupation are left null for the in-app
 * setup (Get Started 1/3); the trigger already treats them as optional.
 *
 * Username uniqueness is enforced by the `users_username_lower_key` index
 * rather than a pre-flight check: RLS only lets a user read their own row, and
 * exposing a public "is this username free?" RPC would add an enumeration
 * surface for very little gain. The trigger's failure rolls back the auth.users
 * insert too, so a rejected signup leaves nothing behind.
 */
export async function signUpWithPassword(input: SignUpInput): Promise<AuthResult> {
  const parsed = signUpSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: {
        username: parsed.username,
      },
    },
  })

  if (error) {
    if (isProfileConflict(error.message)) {
      return {
        ok: false,
        message: 'That username is already taken.',
        fieldErrors: { username: 'That username is already taken.' },
      }
    }
    return { ok: false, message: error.message }
  }

  // Email confirmation is disabled for this project, so signUp returns a live
  // session. New accounts land on the dashboard and are invited to take the
  // questionnaire from there rather than being held at it.
  return { ok: true, next: 'dashboard' }
}

/**
 * Supabase Auth reports a trigger failure as a generic database error. The
 * only constraint the trigger can violate is the username unique index.
 */
function isProfileConflict(message: string): boolean {
  return /database error/i.test(message)
}
