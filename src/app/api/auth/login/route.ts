import { NextResponse } from 'next/server'

import { signInWithPassword } from '@/app/features/auth/api/sign-in'
import { fieldErrors, loginSchema } from '@/app/features/auth/schema'

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    )
  }

  const result = await signInWithPassword(parsed.data)
  return NextResponse.json(result, { status: result.ok ? 200 : 401 })
}
