import type { OnboardingStep } from './types'

/** Where each onboarding step lives. Shared by the API routes and the forms. */
export const ONBOARDING_PATHS: Record<OnboardingStep, string> = {
  'complete-profile': '/onboarding/profile',
  isq: '/isq',
  dashboard: '/dashboard',
}
