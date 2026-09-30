import 'server-only'

import { after } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

import type { Database } from './supabase/database.types'

export type IntegrationTarget = 'alpaca' | 'finnhub' | 'exchange-rate' | 'claude' | 'gemini' | 'supabase-auth' | 'cloudinary'

export type IntegrationEntry = {
  target: IntegrationTarget
  /** What was asked for, e.g. `bars`, `snapshots`, `quote`. Never a key or a user value. */
  action: string
  ok: boolean
  durationMs: number
  httpStatus?: number
  error?: string
}

/**
 * A provider path as a route pattern for the log: the version prefix dropped
 * and ticker-shaped segments replaced, so rows group by endpoint and never
 * carry user input. `/v2/stocks/AAPL/bars` -> `stocks/:symbol/bars`.
 */
export function routePattern(path: string): string {
  return path.replace(/^\/v[0-9a-z]+\//, '').replace(/\/[A-Z0-9.%-]{1,12}(?=\/|$)/g, '/:symbol')
}

/** Responses this fast came from Next's data cache, not the provider. Logging them would drown the real calls. */
const CACHE_HIT_MS = 5

let client: ReturnType<typeof createClient<Database>> | null = null

/**
 * A cookie-less client: logging runs after the response is sent, where
 * request cookies are no longer readable, and the row needs no identity.
 * `log_integration()` is the only thing it calls, and that function
 * validates every argument.
 */
function logClient() {
  client ??= createClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

/**
 * Records one external API call in public.integration_logs for the admin
 * Developer Dashboard (2026-09-29). Runs after the response via `after()`,
 * so it never slows a page, and never throws: a logging failure must not
 * break the thing being logged.
 */
export function logIntegration(entry: IntegrationEntry) {
  if (entry.ok && entry.durationMs < CACHE_HIT_MS) return

  const write = async () => {
    const { error } = await logClient().rpc('log_integration', {
      p_target: entry.target,
      p_action: entry.action.slice(0, 80),
      p_status: entry.ok ? 'success' : 'error',
      p_duration_ms: Math.max(0, Math.round(entry.durationMs)),
      p_http_status: entry.httpStatus,
      p_error: entry.error?.slice(0, 500),
    })
    if (error) console.error('[integration-log] could not write:', error.message)
  }

  try {
    after(write)
  } catch {
    // Outside a request (build time, scripts): write directly, unawaited.
    void write().catch(() => {})
  }
}

/** Times `work` and logs it as one call to `target`. Rethrows whatever `work` throws. */
export async function withIntegrationLog<T>(
  target: IntegrationTarget,
  action: string,
  work: () => Promise<T>,
  status?: (result: T) => number | undefined,
): Promise<T> {
  const started = performance.now()
  try {
    const result = await work()
    logIntegration({ target, action, ok: true, durationMs: performance.now() - started, httpStatus: status?.(result) })
    return result
  } catch (error) {
    logIntegration({
      target,
      action,
      ok: false,
      durationMs: performance.now() - started,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
