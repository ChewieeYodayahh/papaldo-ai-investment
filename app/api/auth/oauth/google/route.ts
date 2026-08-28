import { NextResponse } from 'next/server'

import { getGoogleAuthUrl } from '@/features/auth/api/google'

export async function POST() {
  const result = await getGoogleAuthUrl()
  if ('error' in result) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, url: result.url })
}
