import { NextResponse, type NextRequest } from 'next/server'

import { exchangeCodeForSession } from '@/app/features/auth/api/google'
import { resolveOnboardingStep } from '@/app/features/auth/api/profile'
import { takeReturnTo } from '@/app/features/auth/api/return-to'
import { ONBOARDING_PATHS } from '@/app/features/auth/routes'

/**
 * Every Supabase redirect lands here with `?code=`: Google sign-in, linking
 * Google from the profile page, and the password-confirmation email.
 *
 * Sign-in goes wherever onboarding says. The other two stored a return path
 * (`return-to.ts`) before leaving, and go back to it -- with the error, if
 * Supabase sent one, so the profile page can say what went wrong.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const origin = request.nextUrl.origin
  const returnTo = await takeReturnTo()

  const providerError = params.get('error_description') ?? params.get('error')
  if (providerError) {
    return NextResponse.redirect(withParam(`${origin}${returnTo ?? '/login'}`, 'error', providerError))
  }

  const code = params.get('code')
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const exchange = await exchangeCodeForSession(code)
  if (!exchange.ok) {
    return NextResponse.redirect(withParam(`${origin}${returnTo ?? '/login'}`, 'error', 'oauth_failed'))
  }

  if (returnTo) {
    return NextResponse.redirect(`${origin}${returnTo}`)
  }

  const step = await resolveOnboardingStep()
  return NextResponse.redirect(`${origin}${ONBOARDING_PATHS[step]}`)
}

function withParam(url: string, key: string, value: string): string {
  const next = new URL(url)
  next.searchParams.set(key, value)
  return next.toString()
}
