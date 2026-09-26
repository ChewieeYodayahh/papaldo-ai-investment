import { NextResponse, type NextRequest } from 'next/server'

import { getGoogleLinkUrl } from '@/app/features/auth/api/google'

/** Consent URL for linking Google to the signed-in account. Always answers JSON. */
export async function POST(request: NextRequest) {
  try {
    const result = await getGoogleLinkUrl(request.nextUrl.origin)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    console.error('[auth] Google linking could not start:', error)
    return NextResponse.json({ ok: false, message: 'Could not start linking Google. Please try again later.' }, { status: 500 })
  }
}
