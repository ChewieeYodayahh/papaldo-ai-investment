import 'server-only'

import { getCompanyNews, getMarketNews, type FinnhubNewsItem } from '@/app/core/services/finnhub'

import { attempt, type MarketResult } from './result'

/**
 * News, and only news. Finnhub's whole remaining job (Carlos, 2026-09-11) --
 * prices, symbols and assets all moved to Alpaca.
 *
 * Two different caps, for two different readers (Carlos, 2026-09-11):
 *
 *   Display  4 per ticker per week.  A person reading a symbol page wants the
 *                                    week's signal, not a feed. Four a day was
 *                                    still "too much".
 *   Analysis 4 per ticker per day.   The advising engine is not reading, it is
 *                                    summarising, and more input is better
 *                                    input -- bounded only by what the API
 *                                    allows.
 *
 * Keeping both in one module is deliberate: the numbers are a product
 * decision, and splitting them across files is how they drift apart.
 */
export type NewsItem = FinnhubNewsItem

/** What a person sees on a symbol page. */
const MAX_PER_WEEK_DISPLAY = 4

/** What the advising engine may ingest, when rate limits allow. */
const MAX_PER_DAY_ANALYSIS = 4

/**
 * Bucket keys in the viewer's timezone, not UTC.
 *
 * These look equivalent and are not: the list renders `toLocaleDateString()`,
 * so a story filed in the New York evening lands on the next UTC day. Bucketing
 * by `toISOString()` let seven headlines through a cap of four under a single
 * visible date -- observed on AAPL, 2026-09-11.
 */
function localDayKey(item: NewsItem): string {
  const d = new Date(item.datetime * 1000)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Monday-anchored week key, so a cap of four cannot reset mid-week. */
function localWeekKey(item: NewsItem): string {
  const d = new Date(item.datetime * 1000)
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  // getDay() is 0 for Sunday, which belongs to the week that started six days
  // earlier, not the one starting tomorrow.
  const offset = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - offset)
  return `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`
}

function capPer(items: NewsItem[], keyOf: (item: NewsItem) => string, limit: number): NewsItem[] {
  const seen = new Map<string, number>()
  const kept: NewsItem[] = []

  // Newest first, so the survivors of a bucket are that bucket's latest.
  for (const item of [...items].sort((a, b) => b.datetime - a.datetime)) {
    const key = keyOf(item)
    const count = seen.get(key) ?? 0
    if (count >= limit) continue
    seen.set(key, count + 1)
    kept.push(item)
  }

  return kept
}

const DISPLAY_WINDOW_DAYS = 28
const ANALYSIS_WINDOW_DAYS = 7

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function fetchCompanyNews(symbol: string, days: number): Promise<NewsItem[]> {
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  return getCompanyNews(symbol, isoDate(from), isoDate(to))
}

/**
 * Headlines for one symbol, four per week, four weeks back.
 *
 * `symbol` comes from Alpaca's catalogue, which answers the open question in
 * Carlos's brief: news follows whatever Alpaca lists rather than a separate
 * Finnhub universe. A symbol Finnhub does not cover returns an empty list,
 * which the UI states plainly rather than hiding.
 */
export async function getSymbolNews(symbol: string): Promise<MarketResult<NewsItem[]>> {
  return attempt(`${symbol} news`, async () =>
    capPer(await fetchCompanyNews(symbol, DISPLAY_WINDOW_DAYS), localWeekKey, MAX_PER_WEEK_DISPLAY),
  )
}

/**
 * Headlines for the advising engine: up to four a day over the last week.
 *
 * Not wired to anything yet -- `core/services/claude.ts` has no caller. It
 * lives here so the engine consumes the agreed budget when it is built,
 * instead of re-deriving a limit at the call site.
 */
export async function getSymbolNewsForAnalysis(symbol: string): Promise<MarketResult<NewsItem[]>> {
  return attempt(`${symbol} news (analysis)`, async () =>
    capPer(await fetchCompanyNews(symbol, ANALYSIS_WINDOW_DAYS), localDayKey, MAX_PER_DAY_ANALYSIS),
  )
}

/** General market headlines for the dashboard, under the display cap. */
export async function getMarketHeadlines(): Promise<MarketResult<NewsItem[]>> {
  return attempt('market news', async () =>
    capPer(await getMarketNews('general'), localWeekKey, MAX_PER_WEEK_DISPLAY),
  )
}
