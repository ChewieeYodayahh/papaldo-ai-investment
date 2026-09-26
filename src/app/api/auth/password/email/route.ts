import { NextResponse } from 'next/server'

import { sendPasswordConfirmation } from '@/app/features/auth/api/password'

/** Emails the signed-in user a confirmation link for changing their password. */
export async function POST() {
  const result = await sendPasswordConfirmation()
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
