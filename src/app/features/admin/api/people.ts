import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'
import type { Tables } from '@/app/core/services/supabase/database.types'

export type AdminUser = {
  id: string
  email: string
  username: string | null
  createdAt: string
  lastSignInAt: string | null
  isAdmin: boolean
  band: string | null
  orders: number
  providers: string[]
}

/** Every account with sign-in activity, band and trade count (`admin_list_users()`). */
export const listUsers = cache(async (): Promise<AdminUser[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) {
    console.error('[admin] users unavailable:', error.message)
    return []
  }
  return (data ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
    isAdmin: u.is_admin,
    band: u.band,
    orders: Number(u.orders),
    providers: u.providers ?? [],
  }))
})

/** Grants or removes the admin role. The database refuses non-admins and self-demotion. */
export async function setAdmin(userId: string, makeAdmin: boolean): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_set_role', { p_user_id: userId, p_make_admin: makeAdmin })
  return error ? { ok: false, message: error.message } : { ok: true }
}

export type SupportMessage = Tables<'support_messages'>

export async function listSupport(showResolved: boolean): Promise<SupportMessage[]> {
  const supabase = await createClient()
  let query = supabase.from('support_messages').select('*').order('created_at', { ascending: false }).limit(200)
  if (!showResolved) query = query.eq('status', 'open')
  const { data, error } = await query
  if (error) console.error('[admin] support unavailable:', error.message)
  return data ?? []
}

export async function setSupportStatus(
  id: string,
  status: 'open' | 'resolved',
  adminId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('support_messages')
    .update(
      status === 'resolved'
        ? { status, resolved_at: new Date().toISOString(), resolved_by: adminId }
        : { status, resolved_at: null, resolved_by: null },
    )
    .eq('id', id)
  return error ? { ok: false, message: error.message } : { ok: true }
}
