import 'server-only'

import { AlpacaError, type AlpacaFailure } from '@/app/core/services/alpaca'
import {
  getBasicFinancials,
  getCompanyProfile,
  getRecommendations,
  type FinnhubCompanyProfile,
  type FinnhubRecommendation,
} from '@/app/core/services/finnhub'

import { getAssetRecord, type Asset } from './assets'
import { getQuote, type Quote } from './quotes'
import { attempt, type MarketResult } from './result'

/**
 * Reads behind the symbol detail page.
 *
 * Provider split (Carlos, 2026-09-11): **Alpaca is the pricing and asset
 * engine** -- the price, the day's range and the symbol's identity all come
 * from it. **Finnhub is the news feed**, handled in `news.ts`.
 *
 * One documented exception. The research cards -- company logo and industry,
 * the valuation ratios, analyst coverage -- have no Alpaca equivalent at any
 * plan level, and Alpaca's logo endpoint answers 403 here besides. They stay
 * on Finnhub rather than being deleted, and they are `MarketResult`-wrapped
 * like everything else, so dropping Finnhub to news-only later means deleting
 * three cards, not untangling the page.
 *
 * Each panel is fetched independently, so one endpoint failing empties one
 * card. The quote is the exception the page cannot render without.
 */

/** Quarters of earnings history kept for the chart. Six years. */
const EARNINGS_QUARTERS = 24

export type FundamentalPoint = {
  /** ISO date, safe to hand straight to lightweight-charts as a BusinessDay. */
  time: string
  value: number
}

export type SymbolOverview = {
  symbol: string
  /** Alpaca. The page cannot render without this. */
  quote: Quote
  /** Alpaca. Official name, venue, and whether an order could be placed. */
  asset: MarketResult<Asset>
  /** Finnhub. Logo and industry only -- see the exception note above. */
  profile: MarketResult<FinnhubCompanyProfile>
  /** Finnhub. */
  metrics: MarketResult<Record<string, number | string | null>>
  /** Finnhub. Quarterly earnings per share, oldest first. */
  earnings: FundamentalPoint[]
}

/**
 * Alpaca echoes symbols uppercase and the URL segment is user-supplied.
 * Normalising keeps `/markets/aapl` and `/markets/AAPL` the same page.
 * Slashes survive because crypto symbols are pair-shaped (`BTC/USD`).
 */
export function normalizeSymbol(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase().slice(0, 12)
}

export function isPlausibleSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9./-]{0,11}$/.test(symbol)
}

/** Crypto is pair-shaped; nothing else in Alpaca's catalogue contains a slash. */
export function assetClassOf(symbol: string) {
  return symbol.includes('/') ? ('crypto' as const) : ('equity' as const)
}

/**
 * Quarterly EPS, oldest first, deduplicated -- the order lightweight-charts
 * needs, which it enforces by silently dropping points.
 */
function toEarningsSeries(series: Record<string, { period: string; v: number }[]> | undefined) {
  const eps = series?.eps ?? []
  return (
    eps
      .filter((point) => Number.isFinite(point.v) && Boolean(point.period))
      .map((point) => ({ time: point.period, value: point.v }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .filter((point, i, all) => i === 0 || point.time !== all[i - 1].time)
      // Finnhub goes back as far as 1989 for a name like AAPL. Six years is
      // enough to read a trend; 149 bars in a 220px card is a smear.
      .slice(-EARNINGS_QUARTERS)
  )
}

export async function getSymbolOverview(symbol: string): Promise<MarketResult<SymbolOverview>> {
  const assetClass = assetClassOf(symbol)

  return attempt(`${symbol} overview`, async () => {
    const [quote, asset, profile, financials] = await Promise.all([
      getQuote(symbol, assetClass),
      getAssetRecord(symbol),
      // Crypto has no company behind it, so the Finnhub research calls are
      // skipped rather than fired and discarded.
      assetClass === 'crypto'
        ? Promise.resolve({ ok: false as const, reason: 'forbidden' as const })
        : attempt(`${symbol} profile`, () => getCompanyProfile(symbol)),
      assetClass === 'crypto'
        ? Promise.resolve({ ok: false as const, reason: 'forbidden' as const })
        : attempt(`${symbol} fundamentals`, () => getBasicFinancials(symbol)),
    ])

    if (!quote.ok) {
      // Rethrown as an AlpacaError so `attempt` keeps the real reason. A plain
      // Error collapsed every cause -- a missing key included -- into
      // 'upstream-error'. getQuote only ever fails with an Alpaca reason.
      throw new AlpacaError(quote.reason as AlpacaFailure, `No Alpaca quote for ${symbol} (${quote.reason})`)
    }

    return {
      symbol,
      quote: quote.data,
      asset,
      profile,
      metrics: financials.ok ? { ok: true as const, data: financials.data.metric } : financials,
      earnings: financials.ok ? toEarningsSeries(financials.data.series.quarterly) : [],
    }
  })
}

/** Most recent analyst recommendation month, or null when none is published. */
export async function getSymbolRatings(
  symbol: string,
): Promise<MarketResult<FinnhubRecommendation | null>> {
  return attempt(`${symbol} ratings`, async () => {
    const trend = await getRecommendations(symbol)
    // Finnhub returns newest first, but do not rely on it.
    return [...trend].sort((a, b) => b.period.localeCompare(a.period))[0] ?? null
  })
}
