import { NextResponse, type NextRequest } from 'next/server'

import { exchangeCodeForSession } from '@/features/auth/api/google'
import { resolveOnboardingStep } from '@/features/auth/api/profile'
import { ONBOARDING_PATHS } from '@/features/auth/routes'

/**
 * Google redirects here with `?code=`. Exchange it for a session cookie, then
 * send the user to whichever onboarding step they still owe.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const exchange = await exchangeCodeForSession(code)
  if (!exchange.ok) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const step = await resolveOnboardingStep()
  return NextResponse.redirect(`${origin}${ONBOARDING_PATHS[step]}`)
}
