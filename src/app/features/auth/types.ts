/**
 * Where a signed-in user should be sent next.
 *
 * There is no 'isq' step any more (Carlos, 2026-09-11). Completing the profile
 * is still required -- the app cannot address someone it has no username for --
 * but the questionnaire is now an invitation on the dashboard, not a toll gate
 * in front of it. A new account lands on the dashboard and is asked, not
 * redirected.
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
}
