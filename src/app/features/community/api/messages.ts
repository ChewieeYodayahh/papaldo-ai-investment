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
  /** Posted under a ten-minute guest pass rather than an account. */
  guest: boolean
}

export const PAGE = 60
export const MAX_LENGTH = 1000
/** Guest messages are shorter (the database enforces it too). */
export const GUEST_MAX_LENGTH = 500
export const GUEST_PASS_MINUTES = 10

type Row = { id: number; author_name: string; body: string; created_at: string; user_id?: string | null; is_guest?: boolean }

function toMessage(row: Row, viewer: string | null): ChatMessage {
  return {
    id: row.id,
    author: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    mine: Boolean(viewer && row.user_id === viewer),
    guest: Boolean(row.is_guest),
  }
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
  const columns = viewer ? 'id, author_name, body, created_at, user_id, is_guest' : 'id, author_name, body, created_at, is_guest'

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
    .select('id, author_name, body, created_at, user_id, is_guest')
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

export type GuestPass = { secret: string; name: string; expiresAt: string }
export type GuestPassResult = ({ ok: true } & GuestPass) | { ok: false; status: number; message: string }

/**
 * Issues a ten-minute guest pass for a name (`start_guest_session`). The
 * database vets the name (2-24 letters, numbers or spaces; not reserved; not a
 * member's username) and caps new passes; its messages come back as-is.
 */
export async function startGuestSession(rawName: unknown): Promise<GuestPassResult> {
  if (await getSessionUserId()) return { ok: false, status: 400, message: 'You are signed in, so you chat with your account.' }
  const name = typeof rawName === 'string' ? rawName.trim().replace(/\s+/g, ' ') : ''
  if (!name) return { ok: false, status: 400, message: 'Pick a name first.' }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('start_guest_session', { p_name: name })
  if (error || !data) {
    return error?.code === 'P0001'
      ? { ok: false, status: /Lots of new guests/.test(error.message) ? 429 : 400, message: error.message }
      : { ok: false, status: 500, message: 'Could not start a guest pass. Try again.' }
  }
  const expiresAt = new Date(Date.now() + GUEST_PASS_MINUTES * 60_000).toISOString()
  return { ok: true, secret: data, name, expiresAt }
}

/** Posts with a guest pass (`post_guest_message`); name and rate limits are the database's. */
export async function postGuestMessage(rawSecret: unknown, rawBody: unknown): Promise<PostResult> {
  if (await getSessionUserId()) return { ok: false, status: 400, message: 'You are signed in, so you chat with your account.' }
  const secret = typeof rawSecret === 'string' ? rawSecret : ''
  const body = typeof rawBody === 'string' ? rawBody.trim() : ''
  if (!secret) return { ok: false, status: 401, message: 'Pick a name to join the conversation.' }
  if (!body) return { ok: false, status: 400, message: 'Write a message first.' }
  if (body.length > GUEST_MAX_LENGTH) return { ok: false, status: 400, message: `Guest messages are up to ${GUEST_MAX_LENGTH} characters.` }

  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('post_guest_message', { p_secret: secret, p_body: body })
  if (error || typeof id !== 'number') {
    if (error?.code !== 'P0001') return { ok: false, status: 500, message: 'The message was not sent. Try again.' }
    const status = /expired/.test(error.message) ? 401 : /too fast|busy/.test(error.message) ? 429 : 400
    return { ok: false, status, message: error.message }
  }
  const { data } = await supabase.from('chat_messages').select('id, author_name, body, created_at, is_guest').eq('id', id).single()
  if (!data) return { ok: false, status: 500, message: 'Sent, but it could not be shown yet. It will appear shortly.' }
  // The guest just wrote it, so it is theirs for this tab (guests have no account id to compare).
  return { ok: true, message: { ...toMessage(data, null), mine: true } }
}

