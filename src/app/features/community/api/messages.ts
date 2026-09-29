import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUserId } from '@/app/core/services/supabase/session'

export type ChatMessage = {
  id: number
  author: string
  body: string
  createdAt: string
  /** True for the viewer's own messages. Guests never see account ids. */
  mine: boolean
}

export const PAGE = 60
export const MAX_LENGTH = 1000

type Row = { id: number; author_name: string; body: string; created_at: string; user_id?: string }

function toMessage(row: Row, viewer: string | null): ChatMessage {
  return { id: row.id, author: row.author_name, body: row.body, createdAt: row.created_at, mine: Boolean(viewer && row.user_id === viewer) }
}

/**
 * The room's messages, oldest first. With `after`, only newer ones -- what
 * the client polls for. Guests may read (RLS lets anon see visible rows, and
 * their column grant leaves out user_id, so it is only selected for
 * signed-in viewers).
 */
export async function listMessages(after?: number): Promise<ChatMessage[]> {
  const viewer = await getSessionUserId()
  const supabase = await createClient()
  const columns = viewer ? 'id, author_name, body, created_at, user_id' : 'id, author_name, body, created_at'

  let query = supabase.from('chat_messages').select(columns).is('removed_at', null)
  if (after && Number.isFinite(after)) {
    query = query.gt('id', after).order('id', { ascending: true }).limit(PAGE)
    const { data } = await query
    return ((data ?? []) as unknown as Row[]).map((row) => toMessage(row, viewer))
  }
  const { data } = await query.order('id', { ascending: false }).limit(PAGE)
  return ((data ?? []) as unknown as Row[]).reverse().map((row) => toMessage(row, viewer))
}

export type PostResult = { ok: true; message: ChatMessage } | { ok: false; status: number; message: string }

/** Posts as the signed-in user. The database stamps the name and slows floods (P0001). */
export async function postMessage(rawBody: unknown): Promise<PostResult> {
  const viewer = await getSessionUserId()
  if (!viewer) return { ok: false, status: 401, message: 'Sign in to join the conversation.' }

  const body = typeof rawBody === 'string' ? rawBody.trim() : ''
  if (!body) return { ok: false, status: 400, message: 'Write a message first.' }
  if (body.length > MAX_LENGTH) return { ok: false, status: 400, message: `Keep messages under ${MAX_LENGTH.toLocaleString()} characters.` }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ body })
    .select('id, author_name, body, created_at, user_id')
    .single()
  if (error || !data) {
    return error?.code === 'P0001'
      ? { ok: false, status: 429, message: error.message }
      : { ok: false, status: 500, message: 'The message was not sent. Try again.' }
  }
  return { ok: true, message: toMessage(data, viewer) }
}

/** Admin moderation: hides a message for everyone. RLS allows it for admins only. */
export async function removeMessage(id: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const viewer = await getSessionUserId()
  if (!viewer) return { ok: false, message: 'Sign in first.' }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ removed_at: new Date().toISOString(), removed_by: viewer })
    .eq('id', id)
    .select('id')
  if (error) return { ok: false, message: error.message }
  if (!data?.length) return { ok: false, message: 'Only admins can remove messages.' }
  return { ok: true }
}
