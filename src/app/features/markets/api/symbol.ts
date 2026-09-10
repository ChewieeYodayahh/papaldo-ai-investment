import 'server-only'

import {
  getBasicFinancials,
  getCompanyNews,
  getCompanyProfile,
  getQuote,
  getRecommendations,
  type FinnhubCompanyProfile,
  type FinnhubNewsItem,
  type FinnhubQuote,
  type FinnhubRecommendation,
} from '@/app/core/services/finnhub'

import { attempt, type MarketResult } from './result'

/**
 * Reads behind the symbol detail page.
 *
 * Each panel is fetched independently and wrapped in a MarketResult, so one
 * endpoint being rate-limited empties one card rather than the page. The
 * quote is the exception the page cannot render without -- if it fails, the
 * page has no price to show and says so.
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
  quote: FinnhubQuote
  profile: MarketResult<FinnhubCompanyProfile>
  metrics: MarketResult<Record<string, number | string | null>>
  /** Quarterly earnings per share, oldest first. Empty when the plan has none. */
  earnings: FundamentalPoint[]
}

/**
 * Finnhub accepts lowercase but echoes symbols uppercase, and the URL segment
 * is user-supplied. Normalising here keeps `/markets/aapl` and `/markets/AAPL`
 * the same page and keeps anything odd out of the query string.
 */
export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 12)
}

export function isPlausibleSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9.\-]{0,11}$/.test(symbol)
}

/**
 * Quarterly EPS, oldest first.
 *
 * This is the only genuine price-adjacent history the free tier serves --
 * `/stock/candle` is 403 on this plan, so there is no OHLC past to chart. See
 * the endpoint table in core/services/finnhub.ts.
 */
function toEarningsSeries(series: Record<string, { period: string; v: number }[]> | undefined) {
  const eps = series?.eps ?? []
  return (
    eps
      .filter((point) => Number.isFinite(point.v) && Boolean(point.period))
      // Finnhub returns newest first; lightweight-charts needs strictly
      // ascending, unique times or it silently drops points.
      .map((point) => ({ time: point.period, value: point.v }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .filter((point, i, all) => i === 0 || point.time !== all[i - 1].time)
      // Finnhub goes back as far as 1989 for a name like AAPL. Six years is
      // enough to read a trend; 149 bars in a 220px card is a smear.
      .slice(-EARNINGS_QUARTERS)
  )
}

/** Everything the page header and chart need. Throws only if the quote fails. */
export async function getSymbolOverview(symbol: string): Promise<MarketResult<SymbolOverview>> {
  return attempt(`${symbol} overview`, async () => {
    const [quote, profile, financials] = await Promise.all([
      getQuote(symbol),
      attempt(`${symbol} profile`, () => getCompanyProfile(symbol)),
      attempt(`${symbol} fundamentals`, () => getBasicFinancials(symbol)),
    ])

    return {
      symbol,
      quote,
      profile,
      metrics: financials.ok ? { ok: true as const, data: financials.data.metric } : financials,
      earnings: financials.ok ? toEarningsSeries(financials.data.series.quarterly) : [],
    }
  })
}

const NEWS_WINDOW_DAYS = 30

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function getSymbolNews(symbol: string, limit = 8): Promise<MarketResult<FinnhubNewsItem[]>> {
  return attempt(`${symbol} news`, async () => {
    const to = new Date()
    const from = new Date(to.getTime() - NEWS_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const news = await getCompanyNews(symbol, isoDate(from), isoDate(to))
    return news.slice(0, limit)
  })
}

/** Most recent analyst recommendation month, or null when none is published. */
export async function getSymbolRatings(symbol: string): Promise<MarketResult<FinnhubRecommendation | null>> {
  return attempt(`${symbol} ratings`, async () => {
    const trend = await getRecommendations(symbol)
    // Finnhub returns newest first, but do not rely on it.
    return [...trend].sort((a, b) => b.period.localeCompare(a.period))[0] ?? null
  })
}
