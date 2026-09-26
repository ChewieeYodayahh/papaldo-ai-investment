import { NextResponse, type NextRequest } from 'next/server'

import { sendPasswordConfirmation } from '@/app/features/auth/api/password'

/** Emails the signed-in user a confirmation link for changing their password. Always answers JSON. */
export async function POST(request: NextRequest) {
  try {
    const result = await sendPasswordConfirmation(request.nextUrl.origin)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    console.error('[auth] password confirmation email failed:', error)
    return NextResponse.json({ ok: false, message: 'Could not send the email. Please try again later.' }, { status: 500 })
  }
}
