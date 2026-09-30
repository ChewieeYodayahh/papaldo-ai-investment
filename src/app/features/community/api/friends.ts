import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUserId } from '@/app/core/services/supabase/session'

/**
 * Friends (Carlos, 2026-09-30). Every write goes through a database function
 * (`request_friend`, `respond_friend`, `remove_friend`), so nobody can insert
 * an "accepted" row for themselves, and people are addressed by username --
 * account ids never reach the browser.
 */

/** How the viewer stands with someone. `outgoing`/`incoming` are open requests. */
export type Relation = 'self' | 'friends' | 'outgoing' | 'incoming' | 'none'

export type FriendAction = 'request' | 'accept' | 'decline' | 'remove'

export type Friend = { username: string; avatarUrl: string | null; relation: Exclude<Relation, 'self' | 'none'>; since: string }

export type FriendResult = { ok: true; relation: Relation } | { ok: false; status: number; message: string }

const ACTIONS: readonly FriendAction[] = ['request', 'accept', 'decline', 'remove']
const RELATIONS: readonly Relation[] = ['self', 'friends', 'outgoing', 'incoming', 'none']

/** Usernames are 3-30 characters (auth/schema.ts); anything else cannot match. */
export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.trim()
  return name.length >= 3 && name.length <= 30 ? name : null
}

export function isFriendAction(value: unknown): value is FriendAction {
  return ACTIONS.includes(value as FriendAction)
}

export function toRelation(value: unknown): Relation {
  return RELATIONS.includes(value as Relation) ? (value as Relation) : 'none'
}

/** What each function's reply means for the button the viewer sees next. */
const AFTER_REQUEST: Record<string, Relation> = {
  requested: 'outgoing',
  pending: 'outgoing',
  accepted: 'friends',
  friends: 'friends',
}

export async function friendAction(rawUsername: unknown, rawAction: unknown): Promise<FriendResult> {
  if (!(await getSessionUserId())) return { ok: false, status: 401, message: 'Sign in to add friends.' }
  const username = normalizeUsername(rawUsername)
  if (!username) return { ok: false, status: 400, message: 'No member goes by that name.' }
  if (!isFriendAction(rawAction)) return { ok: false, status: 400, message: 'Unknown action.' }

  const supabase = await createClient()
  let relation: Relation
  let error: { code?: string; message: string } | null = null
  if (rawAction === 'request') {
    const result = await supabase.rpc('request_friend', { p_username: username })
    error = result.error
    relation = AFTER_REQUEST[result.data ?? ''] ?? 'outgoing'
  } else if (rawAction === 'remove') {
    error = (await supabase.rpc('remove_friend', { p_username: username })).error
    relation = 'none'
  } else {
    const accept = rawAction === 'accept'
    error = (await supabase.rpc('respond_friend', { p_username: username, p_accept: accept })).error
    relation = accept ? 'friends' : 'none'
  }

  if (error) {
    // P0001 carries a message written for people ("Try again tomorrow.").
    return error.code === 'P0001'
      ? { ok: false, status: 409, message: error.message }
      : { ok: false, status: 500, message: 'That did not go through. Try again.' }
  }
  return { ok: true, relation }
}

/** The viewer's friends and open requests, incoming first. */
export async function listFriends(): Promise<Friend[]> {
  if (!(await getSessionUserId())) return []
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('my_friends')
  if (error || !data) return []
  const order: Record<Friend['relation'], number> = { incoming: 0, friends: 1, outgoing: 2 }
  return data
    .map((row) => ({
      username: row.username,
      avatarUrl: row.avatar_url ?? null,
      relation: row.relation as Friend['relation'],
      since: row.since,
    }))
    .filter((f) => f.relation in order)
    .sort((a, b) => order[a.relation] - order[b.relation] || a.username.localeCompare(b.username))
}
