import { NextResponse } from 'next/server'

import { updateProfile } from '@/app/features/auth/api/profile'
import { fieldErrors, profileUpdateSchema } from '@/app/features/auth/schema'

/** Saves any subset of the profile: one card of the profile page, or one setup step. */
export async function PATCH(request: Request) {
  const parsed = profileUpdateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    )
  }

  const result = await updateProfile(parsed.data)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
