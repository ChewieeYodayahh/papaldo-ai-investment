import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUserId } from '@/app/core/services/supabase/session'

/**
 * Whether the signed-in user is an admin.
 *
 * Roles live in `public.user_roles`, which no client role can write (a role
 * column on `users` would have been self-grantable, since owners may update
 * every column there). RLS lets a user read their own row, so this is one
 * indexed lookup by primary key. Everything an admin can then *see* is gated
 * again inside the database by `private.is_admin()`; this check only decides
 * what the UI offers.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const userId = await getSessionUserId()
  if (!userId) return false

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[roles] could not read the role:', error.message)
    return false
  }
  return data?.role === 'admin'
})
