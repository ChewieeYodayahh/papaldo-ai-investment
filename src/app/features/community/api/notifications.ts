import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUserId } from '@/app/core/services/supabase/session'

/**
 * The social half of the bell: friend requests and acceptances, written by
 * the friend functions in the database. `actorName` is the sender's username
 * at the time, stored because users RLS hides other people's rows.
 */
export type SocialNotification = {
  id: number
  kind: 'friend_request' | 'friend_accepted'
  actorName: string
  createdAt: string
  read: boolean
}

export async function getSocialNotifications(limit = 8): Promise<SocialNotification[]> {
  if (!(await getSessionUserId())) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, actor_name, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data
    .filter((row) => row.kind === 'friend_request' || row.kind === 'friend_accepted')
    .map((row) => ({
      id: row.id,
      kind: row.kind as SocialNotification['kind'],
      actorName: row.actor_name,
      createdAt: row.created_at,
      read: row.read_at !== null,
    }))
}

/** Marks every unread notification read. RLS limits it to the viewer's own. */
export async function markNotificationsRead(): Promise<boolean> {
  const viewer = await getSessionUserId()
  if (!viewer) return false
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', viewer)
    .is('read_at', null)
  return !error
}
