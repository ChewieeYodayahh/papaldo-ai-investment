import type { UniverseQuote } from './api/movers'

/**
 * The /markets sector heatmap's data model (Carlos, 2026-09-26; restyled
 * 2026-09-29 after TradingView's Stock Heatmap). Pure, so it is unit tested; the
 * squarified layout itself is d3-hierarchy's, in `SectorTreemap`.
 *
 *   Scope    stocks in the buyable universe only. ETFs are left out: a fund
 *            is a basket of these same names, and it has assets under
 *            management rather than a market cap to size a tile by.
 *   Size     each tile's area is proportional to its market cap
 *            (tradable_assets.market_cap_usd, from python/market_caps.py). A
 *            stock without one yet takes its sector's median, so a newly
 *            added name still appears at a plausible size instead of vanishing.
 *   Sector % cap-weighted, like an index: sum(cap * change) / sum(cap). An
 *            equal-weighted mean would let a small name move a sector as much
 *            as NVIDIA does.
 *   Colour   seven steps, -3% .. +3% in 1% bands: red, a neutral grey at 0,
 *            green. Anything past +/-3% is the strongest step. The colours
 *            are --heat-* tokens in globals.css, the same in every palette.
 */

export type HeatTile = {
  symbol: string
  name: string
  price: number
  changePercent: number
  /** Area weight: market cap in USD, or the sector median when unknown. */
  size: number
  /** True when `size` is the sector median rather than the stock's own cap. */
  estimatedSize: boolean
}

export type HeatSector = {
  sector: string
  changePercent: number
  tiles: HeatTile[]
}

export const MAX_STEP = 3

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function buildHeatmap(quotes: UniverseQuote[]): HeatSector[] {
  const groups = new Map<string, UniverseQuote[]>()
  for (const quote of quotes) {
    if (quote.sector === 'ETF') continue
    groups.set(quote.sector, [...(groups.get(quote.sector) ?? []), quote])
  }

  const sectors: HeatSector[] = []
  for (const [sector, members] of groups) {
    const known = members.map((q) => q.marketCapUsd).filter((cap): cap is number => typeof cap === 'number' && cap > 0)
    const fallback = median(known) ?? 1

    const tiles = members
      .map((q) => {
        const own = typeof q.marketCapUsd === 'number' && q.marketCapUsd > 0
        return {
          symbol: q.symbol,
          name: q.name,
          price: q.price,
          changePercent: q.changePercent,
          size: own ? (q.marketCapUsd as number) : fallback,
          estimatedSize: !own,
        }
      })
      .sort((a, b) => b.size - a.size)

    const totalSize = tiles.reduce((sum, t) => sum + t.size, 0)
    sectors.push({
      sector,
      changePercent: totalSize > 0 ? tiles.reduce((sum, t) => sum + t.size * t.changePercent, 0) / totalSize : 0,
      tiles,
    })
  }

  // Biggest sector first, so the layout reads like Perplexity's: the heavy
  // group takes the top-left.
  return sectors.sort((a, b) => sum(b) - sum(a))
}

function sum(sector: HeatSector): number {
  return sector.tiles.reduce((total, t) => total + t.size, 0)
}

/**
 * The colour step for a move: -3 .. +3. Rounded to the nearest whole
 * percent, so +0.4% is neutral and +0.6% is the first green -- a quiet day
 * reads as grey, not as a wall of faint colour.
 */
export function colorStep(changePercent: number): number {
  const step = Math.round(changePercent)
  return Math.max(-MAX_STEP, Math.min(MAX_STEP, step)) || 0
}

/**
 * The tile fill for a step: a --heat-* token. The first version mixed the
 * palette's gain/loss colours into the page background, which turned small
 * losses tan and small gains olive (Carlos, 2026-09-29); a heatmap has to
 * read as plain red and green.
 */
export function stepFill(step: number): string {
  const clamped = Math.max(-MAX_STEP, Math.min(MAX_STEP, Math.round(step))) || 0
  if (clamped === 0) return 'var(--heat-0)'
  return `var(--heat-${clamped > 0 ? 'p' : 'n'}${Math.abs(clamped)})`
}

/** Compact market cap: 3.21T, 845B, 12.4B. */
export function formatCap(usd: number): string {
  if (usd >= 1e12) return `${(usd / 1e12).toFixed(2)}T`
  if (usd >= 1e9) return `${usd >= 1e11 ? Math.round(usd / 1e9) : (usd / 1e9).toFixed(1)}B`
  if (usd >= 1e6) return `${Math.round(usd / 1e6)}M`
  return `${Math.round(usd)}`
}
