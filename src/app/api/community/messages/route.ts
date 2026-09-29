import { NextResponse, type NextRequest } from 'next/server'

import { listMessages, postMessage } from '@/app/features/community/api/messages'

/** GET /api/community/messages?after=123 -- messages newer than an id (the chat polls this). */
export async function GET(request: NextRequest) {
  const after = Number(request.nextUrl.searchParams.get('after')) || undefined
  const messages = await listMessages(after)
  return NextResponse.json({ ok: true, messages }, { headers: { 'Cache-Control': 'no-store' } })
}

/** POST /api/community/messages { body } -- signed-in users only. */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { body?: unknown } | null
  const result = await postMessage(payload?.body)
  if (!result.ok) return NextResponse.json({ ok: false, message: result.message }, { status: result.status })
  return NextResponse.json(result, { status: 201 })
}
