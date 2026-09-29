import 'server-only'

import { logIntegration, routePattern as actionFor } from './integration-log'

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
 *
 * Every failure carries a `reason`. The first version of this file threw a
 * bare Error for all of them, so a missing key, a rejected key and a rate
 * limit all surfaced as the same "Finnhub did not respond" card -- which is
 * exactly why a dead dashboard took a triage session to explain.
 */

const FINNHUB_API_URL = 'https://finnhub.io/api/v1'

/** Why a Finnhub call could not be served. Drives the message the user sees. */
export type FinnhubFailure =
  /** FINNHUB_API_KEY is unset in this environment. A deploy config problem, not an outage. */
  | 'not-configured'
  /** Finnhub rejected the key: absent, malformed, revoked, or wrong plan for the endpoint. */
  | 'unauthorized'
  /** Free tier is ~60 req/min. Back off and retry. */
  | 'rate-limited'
  /** Finnhub answered with some other non-2xx status. */
  | 'upstream-error'
  /** The request never completed -- DNS, TLS, timeout, offline. */
  | 'network-error'

export class FinnhubError extends Error {
  constructor(
    readonly reason: FinnhubFailure,
    message: string,
  ) {
    super(message)
    this.name = 'FinnhubError'
  }
}

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
  d: number | null
  dp: number | null
  h: number
  l: number
  o: number
  pc: number
}

/**
 * Whether a key is present. Checked before any network call so a
 * misconfigured deployment is reported as such instead of as an outage.
 */
export function isFinnhubConfigured(): boolean {
  return Boolean(process.env.FINNHUB_API_KEY)
}

async function finnhubFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 30,
): Promise<T> {
  const key = process.env.FINNHUB_API_KEY
  if (!key) {
    throw new FinnhubError(
      'not-configured',
      'FINNHUB_API_KEY is not set. Add it to .env.local for local development and to the ' +
        'Vercel project environment for deployments -- .env.local is gitignored and never ships.',
    )
  }

  const url = new URL(`${FINNHUB_API_URL}${path}`)
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value)
  }
  url.searchParams.set('token', key)

  let response: Response
  const started = performance.now()
  try {
    // Short revalidate window rather than no caching at all -- keeps repeated
    // dashboard loads within a few seconds of each other from burning extra
    // calls against the free-tier budget, without going anywhere near a full
    // ingestion/cache architecture. Slower-moving resources pass a longer one.
    response = await fetch(url, { next: { revalidate } })
  } catch (cause) {
    logIntegration({ target: 'finnhub', action: actionFor(path), ok: false, durationMs: performance.now() - started, error: 'network error' })
    throw new FinnhubError('network-error', `Could not reach Finnhub on ${path}: ${String(cause)}`)
  }
  logIntegration({
    target: 'finnhub',
    action: actionFor(path),
    ok: response.ok,
    durationMs: performance.now() - started,
    httpStatus: response.status,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  })

  if (!response.ok) {
    // Never interpolate `url` into an error -- the token is a query parameter.
    const detail = (await response.text().catch(() => '')).slice(0, 200)
    if (response.status === 401 || response.status === 403) {
      throw new FinnhubError(
        'unauthorized',
        `Finnhub rejected the API key on ${path} (${response.status}). ${detail}`,
      )
    }
    if (response.status === 429) {
      throw new FinnhubError(
        'rate-limited',
        `Finnhub rate limit hit on ${path}. The free tier allows about 60 requests a minute.`,
      )
    }
    throw new FinnhubError('upstream-error', `Finnhub returned ${response.status} on ${path}. ${detail}`)
  }

  return (await response.json()) as T
}

/**
 * Real-time quote for one symbol.
 *
 * Finnhub answers 200 with an all-zero body for a symbol it does not know, so
 * a zeroed quote is treated as "no data" rather than rendered as a $0.00 price.
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  const data = await finnhubFetch<RawQuote>('/quote', { symbol })

  if (!data.c && !data.pc) {
    throw new FinnhubError('upstream-error', `Finnhub returned no quote data for ${symbol}.`)
  }

  return {
    symbol,
    current: data.c,
    change: data.d ?? 0,
    changePercent: data.dp ?? 0,
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
 *
 * Settled rather than all-or-nothing: one unknown ticker or one rate-limited
 * call used to blank the entire watchlist. Partial data is worth showing;
 * only a total failure propagates, and it carries the first real reason.
 */
export async function getQuotes(symbols: string[]): Promise<FinnhubQuote[]> {
  const settled = await Promise.allSettled(symbols.map((symbol) => getQuote(symbol)))

  const quotes: FinnhubQuote[] = []
  const failures: unknown[] = []
  for (const result of settled) {
    if (result.status === 'fulfilled') quotes.push(result.value)
    else failures.push(result.reason)
  }

  if (failures.length) {
    console.error(
      `[finnhub] ${failures.length}/${symbols.length} quote(s) failed:`,
      failures.map((f) => (f instanceof Error ? f.message : String(f))),
    )
  }

  if (!quotes.length) {
    const first = failures[0]
    throw first instanceof FinnhubError
      ? first
      : new FinnhubError('upstream-error', 'No quotes could be fetched.')
  }

  return quotes
}

/** General market news. Not filtered to a symbol -- company_news is a separate, unused endpoint. */
export async function getMarketNews(
  category: 'general' | 'forex' | 'crypto' | 'merger' = 'general',
): Promise<FinnhubNewsItem[]> {
  return finnhubFetch<FinnhubNewsItem[]>('/news', { category })
}

/**
 * ---------------------------------------------------------------------------
 * Symbol detail endpoints.
 *
 * What this plan can and cannot serve, probed against the live API on
 * 2026-09-10 with the project's own key:
 *
 *   /quote                 200   current price, day open/high/low, prev close
 *   /stock/profile2        200   name, logo, exchange, market cap, IPO date
 *   /stock/metric          200   133 ratios + 39 annual / 41 quarterly series
 *   /company-news          200   per-symbol headlines
 *   /stock/recommendation  200   analyst recommendation trend
 *   /stock/candle          403   "You don't have access to this resource."
 *   /crypto/candle         403   same
 *
 * The 403 on candles is the load-bearing fact: **there is no historical OHLC
 * price series on this tier**, so nothing here can draw a conventional price
 * chart of the past. The symbol page plots the live session it observes plus
 * the real quarterly fundamentals series instead. Do not synthesise candles to
 * fill that gap -- see the "no mockups on stock data" rule in CONTEXT.md.
 * ---------------------------------------------------------------------------
 */

export type FinnhubCompanyProfile = {
  ticker: string
  name: string
  exchange: string
  country: string
  currency: string
  /** Finnhub returns this in millions of the reporting currency. */
  marketCapitalization: number
  shareOutstanding: number
  finnhubIndustry: string
  ipo: string
  logo: string
  weburl: string
}

/** One point of a Finnhub fundamentals series. `v` is the value at `period`. */
export type FinnhubSeriesPoint = {
  /** ISO date, e.g. "2026-06-27". */
  period: string
  v: number
}

export type FinnhubBasicFinancials = {
  /** ~133 scalar ratios. Keys are Finnhub's own, e.g. "52WeekHigh", "peTTM". */
  metric: Record<string, number | string | null>
  series: {
    annual?: Record<string, FinnhubSeriesPoint[]>
    quarterly?: Record<string, FinnhubSeriesPoint[]>
  }
}

export type FinnhubRecommendation = {
  symbol: string
  /** ISO date of the month the trend covers. */
  period: string
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
}

/** Company reference data. Cached for an hour -- none of it moves intraday. */
export async function getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile> {
  const data = await finnhubFetch<Partial<FinnhubCompanyProfile>>('/stock/profile2', { symbol }, 3600)
  if (!data.ticker) {
    throw new FinnhubError('upstream-error', `Finnhub has no company profile for ${symbol}.`)
  }
  return data as FinnhubCompanyProfile
}

/**
 * Ratios plus the annual/quarterly fundamentals series. This is the only
 * genuine history the free tier exposes, which is why the symbol page charts
 * it rather than a price line of the past.
 */
export async function getBasicFinancials(symbol: string): Promise<FinnhubBasicFinancials> {
  const data = await finnhubFetch<Partial<FinnhubBasicFinancials>>(
    '/stock/metric',
    { symbol, metric: 'all' },
    900,
  )
  return { metric: data.metric ?? {}, series: data.series ?? {} }
}

/** Headlines for one symbol over a date window. Dates are `YYYY-MM-DD`. */
export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string,
): Promise<FinnhubNewsItem[]> {
  return finnhubFetch<FinnhubNewsItem[]>('/company-news', { symbol, from, to }, 600)
}

/** Analyst recommendation trend, newest month first as Finnhub returns it. */
export async function getRecommendations(symbol: string): Promise<FinnhubRecommendation[]> {
  return finnhubFetch<FinnhubRecommendation[]>('/stock/recommendation', { symbol }, 3600)
}
