import { NextResponse } from 'next/server'

import { changePassword } from '@/app/features/auth/api/password'
import { fieldErrors, passwordChangeSchema } from '@/app/features/auth/schema'

/** Sets a new password. Only works after the confirmation email was opened. */
export async function POST(request: Request) {
  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    )
  }

  const result = await changePassword(parsed.data)
  return NextResponse.json(result, { status: result.ok ? 200 : 403 })
}
