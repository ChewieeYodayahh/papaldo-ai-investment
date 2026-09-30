import { NextResponse, type NextRequest } from 'next/server'

import { removeAvatar, uploadAvatar } from '@/app/features/auth/api/avatar'

/** POST /api/profile/avatar (multipart, field "file") -- replaces the profile picture. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  const result = await uploadAvatar(file instanceof File ? file : null)
  return NextResponse.json(result, { status: result.ok ? 200 : result.status })
}

/** DELETE /api/profile/avatar -- back to the provider picture or initials. */
export async function DELETE() {
  const result = await removeAvatar()
  return NextResponse.json(result, { status: result.ok ? 200 : result.status })
}
