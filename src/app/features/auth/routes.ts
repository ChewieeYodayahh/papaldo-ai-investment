import type { OnboardingStep } from './types'

/**
 * Where each onboarding step lives. Shared by the API routes and the forms.
 *
 * `/isq` is absent on purpose: the questionnaire is reachable and linked from
 * the dashboard, but it is no longer a step anyone is routed *through*.
 */
export const ONBOARDING_PATHS: Record<OnboardingStep, string> = {
  'complete-profile': '/onboarding/profile',
  dashboard: '/dashboard',
}
