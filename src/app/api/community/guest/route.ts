import { NextResponse, type NextRequest } from 'next/server'

import { startGuestSession } from '@/app/features/community/api/messages'

/** POST /api/community/guest { name } -- a ten-minute guest pass for the chat room. */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { name?: unknown } | null
  const result = await startGuestSession(payload?.name)
  return NextResponse.json(result, { status: result.ok ? 201 : result.status })
}
