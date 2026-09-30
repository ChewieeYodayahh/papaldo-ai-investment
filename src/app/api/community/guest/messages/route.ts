import { NextResponse, type NextRequest } from 'next/server'

import { postGuestMessage } from '@/app/features/community/api/messages'

/** POST /api/community/guest/messages { secret, body } -- posts with a guest pass. 401 when it expired. */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { secret?: unknown; body?: unknown } | null
  const result = await postGuestMessage(payload?.secret, payload?.body)
  if (!result.ok) return NextResponse.json(result, { status: result.status })
  return NextResponse.json(result, { status: 201 })
}
