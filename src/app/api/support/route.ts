import { NextResponse, type NextRequest } from 'next/server'

import { submitSupport } from '@/app/features/support/api/submit'

/** POST /api/support { name, email, subject, body } -- files a support message and returns its reference. */
export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  const result = await submitSupport(payload)
  if (!result.ok) return NextResponse.json(result, { status: result.status })
  return NextResponse.json(result, { status: 201 })
}
