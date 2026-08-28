/** Where a signed-in user should be sent next. */
export type OnboardingStep = 'complete-profile' | 'isq' | 'dashboard'

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
