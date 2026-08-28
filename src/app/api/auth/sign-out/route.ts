import { NextResponse } from 'next/server'

import { signOut } from '@/app/features/auth/api/sign-out'

export async function POST() {
  await signOut()
  return NextResponse.json({ ok: true })
}
