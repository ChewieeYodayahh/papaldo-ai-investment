import { NextResponse } from 'next/server'

import { getGoogleAuthUrl } from '@/app/features/auth/api/google'

export async function POST() {
  const result = await getGoogleAuthUrl()
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
