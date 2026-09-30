import { NextResponse } from 'next/server'

import { signUpWithPassword } from '@/app/features/auth/api/sign-up'
import { fieldErrors, signUpSchema } from '@/app/features/auth/schema'

export async function POST(request: Request) {
  const parsed = signUpSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    )
  }

  const result = await signUpWithPassword(parsed.data)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
