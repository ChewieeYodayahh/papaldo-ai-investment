import { NextResponse } from 'next/server'

import { updateProfile } from '@/app/features/auth/api/profile'
import { completeProfileSchema, fieldErrors } from '@/app/features/auth/schema'

export async function POST(request: Request) {
  const parsed = completeProfileSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    )
  }

  const result = await updateProfile(parsed.data)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
