import 'server-only'

import { FinnhubError, type FinnhubFailure } from '@/app/core/services/finnhub'

/**
 * Market reads never throw. A dead market-data provider must degrade the
 * panels that need it, not the page, and the caller needs the reason so the
 * reader is told something truer than "did not respond".
 *
 * Lives in `markets` because `markets` owns market-data vocabulary; the
 * dashboard is a consumer of it. Imports run dashboard -> markets only.
 */
export type MarketResult<T> = { ok: true; data: T } | { ok: false; reason: FinnhubFailure }

export async function attempt<T>(label: string, run: () => Promise<T>): Promise<MarketResult<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (error) {
    const reason: FinnhubFailure = error instanceof FinnhubError ? error.reason : 'upstream-error'
    // Server-side only. The reason reaches the browser; the detail does not.
    console.error(`[markets] ${label} unavailable (${reason}):`, error)
    return { ok: false, reason }
  }
}
