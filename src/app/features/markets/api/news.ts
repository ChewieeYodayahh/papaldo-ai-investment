import 'server-only'

import { getCompanyNews, getMarketNews, type FinnhubNewsItem } from '@/app/core/services/finnhub'

import { attempt, type MarketResult } from './result'

/**
 * News, and only news. Finnhub's whole remaining job (Carlos, 2026-09-11) --
 * prices, symbols and assets all moved to Alpaca.
 *
 * A person reading a symbol page wants the week's signal, not a feed: 4
 * headlines per ticker per week (Carlos, 2026-09-11; four a day was still
 * "too much"). The second, larger budget for the AI advising engine went
 * with that engine (2026-10-02: Papaldo gives no AI investment advice).
 */
export type NewsItem = FinnhubNewsItem

/** What a person sees on a symbol page. */
const MAX_PER_WEEK_DISPLAY = 4

/**
 * Monday-anchored week key, in the viewer's timezone, so a cap of four cannot
 * reset mid-week. Not UTC: the list renders `toLocaleDateString()`, so a story
 * filed in the New York evening lands on the next UTC day, and UTC buckets let
 * seven headlines through under one visible date (AAPL, 2026-09-11).
 */
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
 * `symbol` is one of Papaldo's names (the trading universe). A symbol
 * Finnhub does not cover returns an empty list, which the UI states plainly
 * rather than hiding.
 */
export async function getSymbolNews(symbol: string): Promise<MarketResult<NewsItem[]>> {
  return attempt(`${symbol} news`, async () =>
    capPer(await fetchCompanyNews(symbol, DISPLAY_WINDOW_DAYS), localWeekKey, MAX_PER_WEEK_DISPLAY),
  )
}

/** General market headlines for the dashboard, under the display cap. */
export async function getMarketHeadlines(): Promise<MarketResult<NewsItem[]>> {
  return attempt('market news', async () =>
    capPer(await getMarketNews('general'), localWeekKey, MAX_PER_WEEK_DISPLAY),
  )
}
