import { createBrowserClient } from '@supabase/ssr'

import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

import type { Database } from './database.types'

/**
 * Browser-side Supabase client.
 *
 * NOTE ON ARCHITECTURE: components in this app do not call Supabase directly.
 * Auth and ISQ writes go through the route handlers under `app/api/*`, which
 * delegate to the server-only modules in `features/*\/api`. This factory exists
 * for future client-side reads (realtime subscriptions on the dashboard, say)
 * and is intentionally unused today. If you find yourself reaching for it from
 * a form, add an API route instead.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey())
}
