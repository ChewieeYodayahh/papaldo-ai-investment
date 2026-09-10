import 'server-only'

/**
 * Thin server-only wrapper around the Finnhub REST API.
 *
 * Chosen over Alpha Vantage for this pass (Carlos, 2026-09-10): Finnhub's free
 * tier is ~60 req/min vs. AV's 25/day, which is what makes on-demand
 * real-time quotes viable here without an ingestion job. See
 * wiki/concepts/finnhub-api-integration in the vault for the full evaluation
 * -- including the open question of whether Finnhub's free tier's
 * personal/non-commercial clause fits Papaldo, and the fact Finnhub has no
 * CPI series (AV's `CPI` endpoint is still the only source for that, if the
 * dashboard's inflation-adjusted-cash feature is ever built).
 *
 * Deliberately small: only the two calls this dashboard actually uses
 * (quote, general news). Add functions here one at a time as a real need
 * shows up -- never wrap the whole ~90-endpoint catalog speculatively.
 */

const FINNHUB_API_URL = 'https://finnhub.io/api/v1'

export type FinnhubQuote = {
  symbol: string
  current: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  previousClose: number
}

export type FinnhubNewsItem = {
  id: number
  headline: string
  summary: string
  source: string
  url: string
  image: string
  /** Unix seconds, as Finnhub returns it. */
  datetime: number
  category: string
}

type RawQuote = {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
}

function apiKey(): string {
  const key = process.env.FINNHUB_API_KEY
  if (!key) {
    throw new Error('Missing FINNHUB_API_KEY. Market data features are not configured.')
  }
  return key
}

async function finnhubFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${FINNHUB_API_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('token', apiKey())

  // Short revalidate window rather than no caching at all -- keeps repeated
  // dashboard loads within a few seconds of each other from burning extra
  // calls against the free-tier budget, without going anywhere near a full
  // ingestion/cache architecture.
  const response = await fetch(url, { next: { revalidate: 30 } })
  if (!response.ok) {
    throw new Error(`Finnhub API error ${response.status} on ${path}: ${await response.text()}`)
  }
  return (await response.json()) as T
}

/** Real-time quote for one symbol. */
export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  const data = await finnhubFetch<RawQuote>('/quote', { symbol })
  return {
    symbol,
    current: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
  }
}

/**
 * Quotes for several symbols. Finnhub's free tier has no batch-quote
 * endpoint, so this is N parallel calls -- fine for a handful of symbols,
 * not for a wide universe (see WATCHLIST_SYMBOLS in features/dashboard).
 */
export async function getQuotes(symbols: string[]): Promise<FinnhubQuote[]> {
  return Promise.all(symbols.map((symbol) => getQuote(symbol)))
}

/** General market news. Not filtered to a symbol -- company_news is a separate, unused endpoint. */
export async function getMarketNews(
  category: 'general' | 'forex' | 'crypto' | 'merger' = 'general',
): Promise<FinnhubNewsItem[]> {
  return finnhubFetch<FinnhubNewsItem[]>('/news', { category })
}
