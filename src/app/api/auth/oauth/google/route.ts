import { NextResponse, type NextRequest } from 'next/server'

import { getGoogleAuthUrl } from '@/app/features/auth/api/google'

/**
 * Consent URL for "Continue with Google". Always answers JSON: a thrown error
 * used to escape as an empty HTTP 500, which the button could only read as a
 * network failure.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await getGoogleAuthUrl(request.nextUrl.origin)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (error) {
    console.error('[auth] Google sign-in could not start:', error)
    return NextResponse.json(
      { ok: false, message: 'Google sign-in is not available right now. Please use email instead.' },
      { status: 500 },
    )
  }
}
