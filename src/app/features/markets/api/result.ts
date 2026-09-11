import 'server-only'

import { AlpacaError, type AlpacaFailure } from '@/app/core/services/alpaca'
import { FinnhubError, type FinnhubFailure } from '@/app/core/services/finnhub'

/**
 * Market reads never throw. A dead market-data provider must degrade the
 * panels that need it, not the page, and the caller needs the reason so the
 * reader is told something truer than "did not respond".
 *
 * Lives in `markets` because `markets` owns market-data vocabulary; the
 * dashboard is a consumer of it. Imports run dashboard -> markets only.
 *
 * The two providers' failure unions are kept separate rather than merged:
 * they overlap but are not identical (only Alpaca distinguishes `forbidden`,
 * an authenticated request the plan does not cover), and a reason should
 * always be traceable to the service that produced it.
 */
export type MarketFailure = FinnhubFailure | AlpacaFailure

export type MarketResult<T> = { ok: true; data: T } | { ok: false; reason: MarketFailure }

export async function attempt<T>(label: string, run: () => Promise<T>): Promise<MarketResult<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (error) {
    const reason: MarketFailure =
      error instanceof FinnhubError || error instanceof AlpacaError ? error.reason : 'upstream-error'
    // Server-side only. The reason reaches the browser; the detail does not.
    console.error(`[markets] ${label} unavailable (${reason}):`, error)
    return { ok: false, reason }
  }
}
