import 'server-only'

import { cache } from 'react'

import { getQuotes, type Quote } from './quotes'
import type { MarketResult } from './result'
import { getUniverse, type UniverseAsset } from './universe'

/**
 * Live quotes for the whole buyable universe, in one Alpaca request.
 *
 * Gainers, losers and the sector heatmap are all drawn from this set rather
 * than from a market-wide screener, on purpose: every name the app puts in
 * front of someone as "moving today" is one they can actually act on. The
 * dashboard and the markets page share it, and `cache()` makes that one
 * request per render.
 */
export type UniverseQuote = Quote & Pick<UniverseAsset, 'name' | 'sector'>

export const getUniverseQuotes = cache(async (): Promise<MarketResult<UniverseQuote[]>> => {
  const universe = await getUniverse()
  const result = await getQuotes(universe.map((a) => a.symbol))
  if (!result.ok) return result

  const bySymbol = new Map(universe.map((a) => [a.symbol, a]))
  return {
    ok: true,
    data: result.data.map((quote) => ({
      ...quote,
      name: bySymbol.get(quote.symbol)?.name ?? quote.symbol,
      sector: bySymbol.get(quote.symbol)?.sector ?? 'Other',
    })),
  }
})

export type Movers = { gainers: UniverseQuote[]; losers: UniverseQuote[] }

/**
 * Top `count` up and down on the day. A flat name is neither, so on a quiet
 * day either list can come back shorter than asked -- padding it with
 * unchanged names would call them movers.
 */
export function topMovers(quotes: UniverseQuote[], count: number): Movers {
  const byChange = [...quotes].sort((a, b) => b.changePercent - a.changePercent)
  return {
    gainers: byChange.filter((q) => q.changePercent > 0).slice(0, count),
    losers: byChange.filter((q) => q.changePercent < 0).reverse().slice(0, count),
  }
}

export type SectorMove = { sector: string; changePercent: number; symbols: UniverseQuote[] }

/** Equal-weighted average move per sector, for the heatmap. */
export function sectorMoves(quotes: UniverseQuote[]): SectorMove[] {
  const groups = new Map<string, UniverseQuote[]>()
  for (const quote of quotes) {
    groups.set(quote.sector, [...(groups.get(quote.sector) ?? []), quote])
  }
  return [...groups.entries()]
    .map(([sector, symbols]) => ({
      sector,
      changePercent: symbols.reduce((sum, q) => sum + q.changePercent, 0) / symbols.length,
      symbols: symbols.sort((a, b) => b.changePercent - a.changePercent),
    }))
    .sort((a, b) => b.symbols.length - a.symbols.length)
}
