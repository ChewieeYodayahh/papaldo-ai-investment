import { NextResponse } from 'next/server'

import { removeMessage } from '@/app/features/community/api/messages'

/** DELETE /api/community/messages/:id -- admin moderation; the message is hidden, not erased. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, message: 'Unknown message.' }, { status: 400 })
  const result = await removeMessage(id)
  return NextResponse.json(result, { status: result.ok ? 200 : 403 })
}
