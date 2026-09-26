import type { Income } from './schema'

/**
 * Where a signed-in user should be sent next.
 *
 * There is no 'isq' step any more (Carlos, 2026-09-11), and since 2026-09-26
 * 'complete-profile' means only "has no username yet" -- which in practice is
 * a first Google sign-in. Contact, occupation and income moved into the
 * optional Get Started setup (1/3); nobody is held for them.
 */
export type OnboardingStep = 'complete-profile' | 'dashboard'

export type AuthResult =
  | { ok: true; next: OnboardingStep }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export type UserProfile = {
  id: string
  email: string
  username: string | null
  contact: string | null
  occupation: string | null
  annualIncome: Income | null
  idealIncome: Income | null
}
