import { NextResponse, type NextRequest } from 'next/server'

import { friendAction } from '@/app/features/community/api/friends'

/** POST /api/community/friends { username, action: request | accept | decline | remove } */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { username?: unknown; action?: unknown } | null
  const result = await friendAction(payload?.username, payload?.action)
  return NextResponse.json(result, { status: result.ok ? 200 : result.status })
}
