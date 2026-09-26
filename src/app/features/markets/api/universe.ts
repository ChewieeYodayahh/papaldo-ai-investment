import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'

/**
 * The curated buyable universe, read from `tradable_assets`.
 *
 * Two different lists exist in this app and conflating them causes real bugs:
 *
 *   Alpaca's catalogue  8,515 names. What `/markets` browses. View only.
 *   This universe       50 names. What an order may be placed against.
 *
 * `place_order` raises `PA007` for anything outside this set, so any symbol
 * the UI *promotes* had better be in it. Before this module existed, the
 * dashboard watchlist and the markets featured row were hardcoded and had
 * drifted: they pushed GOOGL, TSLA and NFLX, none of which are buyable, and
 * one account already held GOOGL as a result. Deriving both lists from here
 * makes that divergence impossible rather than merely fixed.
 *
 * `cache()` dedupes within a render, so a page reading both the featured list
 * and a buyability check pays one query.
 */
export type UniverseAsset = {
  symbol: string
  name: string
  sector: string
  riskTier: 'conservative' | 'moderate' | 'aggressive'
  /** Latest market cap in USD (python/market_caps.py); null for ETFs and until first fetched. */
  marketCapUsd: number | null
}

export const getUniverse = cache(async (): Promise<UniverseAsset[]> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tradable_assets')
    .select('symbol, name, sector, risk_tier, market_cap_usd')
    .eq('active', true)
    .order('symbol')

  return (data ?? []).map((row) => ({
    symbol: row.symbol,
    name: row.name,
    sector: row.sector,
    riskTier: row.risk_tier as UniverseAsset['riskTier'],
    marketCapUsd: row.market_cap_usd === null ? null : Number(row.market_cap_usd),
  }))
})

/** Whether an order may be placed for this symbol. Mirrors the `PA007` check. */
export async function isBuyable(symbol: string): Promise<boolean> {
  return (await getUniverse()).some((a) => a.symbol === symbol)
}

/**
 * A default set to show, spread across sectors rather than taken off the top
 * of an alphabetical list — otherwise the featured row is eight ETFs.
 *
 * Round-robin by sector, alphabetical within it, so the result is stable
 * between renders and never contains a symbol that cannot be bought.
 */
export async function getFeaturedSymbols(limit = 8): Promise<string[]> {
  const universe = await getUniverse()

  const bySector = new Map<string, string[]>()
  for (const asset of universe) {
    const list = bySector.get(asset.sector) ?? []
    list.push(asset.symbol)
    bySector.set(asset.sector, list)
  }

  const queues = [...bySector.keys()].sort().map((s) => bySector.get(s)!)
  const picked: string[] = []
  for (let round = 0; picked.length < limit; round += 1) {
    let tookAny = false
    for (const queue of queues) {
      if (round >= queue.length) continue
      picked.push(queue[round])
      tookAny = true
      if (picked.length === limit) break
    }
    if (!tookAny) break
  }

  return picked
}
