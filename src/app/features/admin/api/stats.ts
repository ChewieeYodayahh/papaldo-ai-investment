import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'

export type AdminStats = {
  users: number
  users_7d: number
  signed_in_24h: number
  with_risk_profile: number
  bands: Record<string, number>
  orders: number
  orders_24h: number
  orders_by_day: Array<{ day: string; orders: number }>
  support_open: number
  blog_published: number
  blog_drafts: number
  chat_24h: number
  integration_24h: number
  integration_errors_24h: number
  integration_by_target_24h: Record<string, { calls: number; errors: number; avg_ms: number | null }>
  integration_by_hour: Array<{ hour: string; calls: number; errors: number }>
  notifications_24h: number
  notifications_failed_24h: number
  audit_24h: number
  database_bytes: number
  tables: Array<{ name: string; rows: number; bytes: number }>
  benchmarks_as_of: string | null
  market_caps_as_of: string | null
}

/** Everything the Overview and Resources pages count, from one database call (`admin_stats()`). */
export const getAdminStats = cache(async (): Promise<AdminStats | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) {
    console.error('[admin] stats unavailable:', error.message)
    return null
  }
  return data as unknown as AdminStats
})

/**
 * When the weekly benchmark pipeline last wrote. `admin_stats().benchmarks_as_of`
 * is the latest *month* stored, which lags by design; this is the run itself.
 */
export async function getBenchmarksRefreshedAt(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('market_benchmarks')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.updated_at ?? null
}
