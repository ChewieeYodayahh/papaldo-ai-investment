import 'server-only'

import { createClient } from '@/shared/supabase/server'

import type { AuthResult } from '../types'
import { loginSchema, type LoginInput } from '../schema'
import { resolveOnboardingStep } from './profile'

export async function signInWithPassword(input: LoginInput): Promise<AuthResult> {
  const parsed = loginSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  })

  if (error) {
    // Deliberately generic: never reveal whether the address is registered.
    return { ok: false, message: 'Incorrect email or password.' }
  }

  return { ok: true, next: await resolveOnboardingStep() }
}
