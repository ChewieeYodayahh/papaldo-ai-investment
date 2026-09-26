import { NextResponse } from 'next/server'

import { getGoogleLinkUrl } from '@/app/features/auth/api/google'

/** Consent URL for linking Google to the signed-in account. */
export async function POST() {
  const result = await getGoogleLinkUrl()
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
