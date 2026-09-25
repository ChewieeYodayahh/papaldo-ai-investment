import 'server-only'

/**
 * Thin server-only wrapper around the Alpaca Market Data API.
 *
 * Scope: Alpaca is Papaldo's pricing and asset engine (Carlos, 2026-09-11).
 * It supplies the tradable universe, live prices and daily history. Finnhub
 * is reduced to the news feed.
 *
 * Two hosts, for one reason. Prices and bars come from
 * `data.alpaca.markets`. The asset *catalogue* (`/v2/assets`) is only served
 * by the trading host, so `getAsset`/`listTradableAssets` read
 * `paper-api.alpaca.markets` -- a read of a public reference list, not a
 * touch of the account.
 *
 * The hard line stays: **no endpoint here places, cancels or reads an
 * order, a position or a balance.** Every user's cash, holdings and order
 * history live in Papaldo's own Supabase tables, and simulated fills are
 * priced from `getLatestPrice`. Calling `/v2/orders` or `/v2/positions` from
 * this module would quietly turn a simulation into a real brokerage
 * integration.
 *
 * Why it exists alongside `finnhub.ts` rather than replacing it: Finnhub's
 * plan answers 403 on `/stock/candle`, so it cannot draw price history.
 * Alpaca can, for both equities and crypto, which is what let
 * `features/markets/api/candles.mock.ts` be deleted.
 *
 * Verified against the live API on 2026-09-11 with this project's key:
 *
 *   GET /v2/stocks/{symbol}/bars                 200   daily OHLCV + volume + VWAP
 *   GET /v2/stocks/{symbol}/trades/latest        200   last trade price
 *   GET /v1beta3/crypto/us/bars                  200   daily OHLCV per pair
 *   GET /v1beta3/crypto/us/latest/quotes         200   bid/ask per pair
 *   GET /v1beta1/forex/latest/rates              403   "forbidden: insufficient grants"
 *
 * That 403 is why the PHP display conversion cannot source from Alpaca and
 * needs its own provider.
 */

const ALPACA_DATA_URL = 'https://data.alpaca.markets'

/**
 * Reference data only -- see the scope note above. Paper host by design: the
 * asset catalogue is identical on both, and pointing at the live host would
 * put a production broker URL in a simulation's config for no gain.
 */
const ALPACA_TRADING_URL = 'https://paper-api.alpaca.markets'

/** Why an Alpaca call could not be served. Mirrors FinnhubFailure on purpose. */
export type AlpacaFailure =
  /** Credentials are unset in this environment. A deploy config problem, not an outage. */
  | 'not-configured'
  /** Alpaca rejected the credentials outright. */
  | 'unauthorized'
  /** Authenticated, but this account's plan does not grant the endpoint (403). */
  | 'forbidden'
  /** Too many requests for the plan's per-minute budget. */
  | 'rate-limited'
  /** Alpaca answered with some other non-2xx status. */
  | 'upstream-error'
  /** The request never completed -- DNS, TLS, timeout, offline. */
  | 'network-error'

export class AlpacaError extends Error {
  constructor(
    readonly reason: AlpacaFailure,
    message: string,
  ) {
    super(message)
    this.name = 'AlpacaError'
  }
}

/** Which Alpaca data namespace a symbol belongs to. */
export type AssetClass = 'equity' | 'crypto'

export type AlpacaBar = {
  /** ISO date (YYYY-MM-DD), ready for lightweight-charts as a BusinessDay. */
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type AlpacaTradePrice = {
  symbol: string
  price: number
  /** ISO 8601, as Alpaca returns it. */
  at: string
}

/** Raw bar as Alpaca sends it: single-letter keys, RFC-3339 timestamp. */
type RawBar = { t: string; o: number; h: number; l: number; c: number; v: number }

export function isAlpacaConfigured(): boolean {
  return Boolean(process.env.ALPACA_API_KEY_ID && process.env.ALPACA_API_SECRET_KEY)
}

function authHeaders(): Record<string, string> {
  const id = process.env.ALPACA_API_KEY_ID
  const secret = process.env.ALPACA_API_SECRET_KEY
  if (!id || !secret) {
    throw new AlpacaError(
      'not-configured',
      'ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY are not both set. Add them to .env.local for ' +
        'local development and to the Vercel project environment for deployments -- .env.local is ' +
        'gitignored and never ships.',
    )
  }
  return { 'APCA-API-KEY-ID': id, 'APCA-API-SECRET-KEY': secret }
}

async function alpacaFetch<T>(
  path: string,
  params: Record<string, string>,
  revalidate: number,
  host: string = ALPACA_DATA_URL,
): Promise<T> {
  const headers = authHeaders()

  const url = new URL(`${host}${path}`)
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value)
  }

  let response: Response
  try {
    // revalidate 0 means "do not hand this to Next's data cache at all".
    // Responses over 2MB cannot be cached, and letting Next try logs a
    // failure on every single request. The asset catalogue is 8.5MB, so it
    // opts out here and is cached in derived, trimmed form by its caller.
    response = await fetch(
      url,
      revalidate === 0 ? { headers, cache: 'no-store' } : { headers, next: { revalidate } },
    )
  } catch (cause) {
    throw new AlpacaError('network-error', `Could not reach Alpaca on ${path}: ${String(cause)}`)
  }

  if (!response.ok) {
    // Credentials travel in headers, not the query string, so `path` is safe
    // to interpolate. The body still gets truncated in case it echoes input.
    const detail = (await response.text().catch(() => '')).slice(0, 200)
    if (response.status === 401) {
      throw new AlpacaError('unauthorized', `Alpaca rejected the credentials on ${path}. ${detail}`)
    }
    if (response.status === 403) {
      throw new AlpacaError(
        'forbidden',
        `This Alpaca plan does not grant ${path} (403). ${detail}`,
      )
    }
    if (response.status === 429) {
      throw new AlpacaError('rate-limited', `Alpaca rate limit hit on ${path}.`)
    }
    throw new AlpacaError('upstream-error', `Alpaca returned ${response.status} on ${path}. ${detail}`)
  }

  return (await response.json()) as T
}

/**
 * Alpaca's free plan forbids querying data from the last 15 minutes. Ending
 * the window just outside that keeps daily-bar requests legal during market
 * hours instead of 403-ing every weekday morning; the cost is that today's
 * in-progress bar is a quarter-hour stale, which the live quote in the page
 * header covers anyway.
 */
function safeEnd(): string {
  // Floored to a 15-minute boundary so the URL -- and with it Next's data
  // cache key -- stays the same for a quarter hour. A millisecond-precise end
  // made every request unique, so the `revalidate` windows below never hit.
  const quarterHour = 15 * 60 * 1000
  return new Date(Math.floor((Date.now() - 16 * 60 * 1000) / quarterHour) * quarterHour).toISOString()
}

function startDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * Equity bar timestamps arrive as session midnight in New York expressed in
 * UTC (`2026-09-10T04:00:00Z` in EDT, `05:00:00Z` in EST); crypto arrives as
 * true UTC midnight. Slicing the date off is correct for both -- converting to
 * a local Date first would shift US sessions into the previous day west of UTC.
 */
function toBar(raw: RawBar): AlpacaBar {
  return {
    time: raw.t.slice(0, 10),
    open: raw.o,
    high: raw.h,
    low: raw.l,
    close: raw.c,
    volume: raw.v,
  }
}

function ascendingUnique(bars: AlpacaBar[]): AlpacaBar[] {
  return bars
    .filter((bar) => Number.isFinite(bar.close) && Boolean(bar.time))
    .sort((a, b) => a.time.localeCompare(b.time))
    .filter((bar, i, all) => i === 0 || bar.time !== all[i - 1].time)
}

/**
 * Daily OHLCV bars, oldest first, deduplicated -- the order and uniqueness
 * lightweight-charts requires, which it enforces by silently dropping points.
 *
 * Crypto symbols are pair-shaped (`BTC/USD`) and live under a different
 * namespace that keys its response by symbol rather than returning a flat
 * array, which is the whole reason `assetClass` exists.
 */
export async function getDailyBars(
  symbol: string,
  assetClass: AssetClass = 'equity',
  days = 400,
): Promise<AlpacaBar[]> {
  const params = { timeframe: '1Day', start: startDaysAgo(days), end: safeEnd(), limit: '1000' }

  if (assetClass === 'crypto') {
    const data = await alpacaFetch<{ bars?: Record<string, RawBar[]> }>(
      '/v1beta3/crypto/us/bars',
      { ...params, symbols: symbol },
      900,
    )
    return ascendingUnique((data.bars?.[symbol] ?? []).map(toBar))
  }

  const data = await alpacaFetch<{ bars?: RawBar[] }>(
    `/v2/stocks/${encodeURIComponent(symbol)}/bars`,
    params,
    900,
  )
  return ascendingUnique((data.bars ?? []).map(toBar))
}

/**
 * Daily bars for many equities in one request -- the markets table draws a
 * trend for every buyable name, and one call per row would be forty.
 *
 * Unlike the single-symbol endpoint this one pages: `limit` caps bars across
 * *all* symbols, so a long window over many names follows next_page_token.
 * Symbols Alpaca has no bars for are absent from the result, not empty.
 */
export async function getDailyBarsMany(symbols: string[], days = 45): Promise<Map<string, AlpacaBar[]>> {
  const result = new Map<string, AlpacaBar[]>()
  if (symbols.length === 0) return result

  const params: Record<string, string> = {
    symbols: symbols.join(','),
    timeframe: '1Day',
    start: startDaysAgo(days),
    end: safeEnd(),
    limit: '10000',
  }

  const raw = new Map<string, RawBar[]>()
  // A handful of pages at most for any window this app asks for; the cap
  // guards against a token that never runs out.
  for (let page = 0; page < 10; page += 1) {
    const data = await alpacaFetch<{ bars?: Record<string, RawBar[]>; next_page_token?: string | null }>(
      '/v2/stocks/bars',
      params,
      900,
    )
    for (const [symbol, bars] of Object.entries(data.bars ?? {})) {
      raw.set(symbol, [...(raw.get(symbol) ?? []), ...bars])
    }
    if (!data.next_page_token) break
    params.page_token = data.next_page_token
  }

  for (const [symbol, bars] of raw) result.set(symbol, ascendingUnique(bars.map(toBar)))
  return result
}

/**
 * Last traded price, used as the fill price when an order is simulated.
 *
 * Equities report an actual last trade. Crypto has no consolidated tape, so
 * the mid of the best bid and ask is the closest honest equivalent -- naming
 * it `price` in both cases hides a real difference, so the distinction is
 * recorded here and should reach anything that displays a fill.
 */
export async function getLatestPrice(
  symbol: string,
  assetClass: AssetClass = 'equity',
): Promise<AlpacaTradePrice> {
  if (assetClass === 'crypto') {
    const data = await alpacaFetch<{
      quotes?: Record<string, { ap: number; bp: number; t: string }>
    }>('/v1beta3/crypto/us/latest/quotes', { symbols: symbol }, 15)

    const quote = data.quotes?.[symbol]
    if (!quote || !quote.ap || !quote.bp) {
      throw new AlpacaError('upstream-error', `Alpaca returned no crypto quote for ${symbol}.`)
    }
    return { symbol, price: (quote.ap + quote.bp) / 2, at: quote.t }
  }

  const data = await alpacaFetch<{ trade?: { p: number; t: string } }>(
    `/v2/stocks/${encodeURIComponent(symbol)}/trades/latest`,
    {},
    15,
  )

  if (!data.trade?.p) {
    throw new AlpacaError('upstream-error', `Alpaca returned no trade for ${symbol}.`)
  }
  return { symbol, price: data.trade.p, at: data.trade.t }
}

/**
 * ---------------------------------------------------------------------------
 * Snapshots -- the live quote surface.
 *
 * One snapshot carries the last trade, the current bid/ask, today's bar and
 * yesterday's bar, which is everything a price header or a watchlist tile
 * needs. The multi-symbol form answers for a whole watchlist in one request,
 * where Finnhub's plan had no batch quote and cost one call per symbol.
 *
 * Response shapes are asymmetric and easy to get wrong: the equity endpoint
 * returns snapshots keyed directly at the top level, while crypto nests them
 * under a `snapshots` key. Verified live 2026-09-11.
 * ---------------------------------------------------------------------------
 */

export type AlpacaQuote = {
  symbol: string
  price: number
  open: number
  high: number
  low: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  /** ISO 8601 timestamp of the price above. */
  at: string
}

type RawSnapshot = {
  dailyBar?: RawBar
  prevDailyBar?: RawBar
  latestTrade?: { p: number; t: string }
  latestQuote?: { ap: number; bp: number; t: string }
}

/**
 * Equities report a real last trade. Crypto has no consolidated tape, so it
 * falls back to the bid/ask midpoint -- the closest honest equivalent, and the
 * same rule `getLatestPrice` follows.
 */
function snapshotPrice(raw: RawSnapshot): { price: number; at: string } | null {
  if (raw.latestTrade?.p) return { price: raw.latestTrade.p, at: raw.latestTrade.t }
  if (raw.latestQuote?.ap && raw.latestQuote.bp) {
    return { price: (raw.latestQuote.ap + raw.latestQuote.bp) / 2, at: raw.latestQuote.t }
  }
  if (raw.dailyBar?.c) return { price: raw.dailyBar.c, at: raw.dailyBar.t }
  return null
}

function toQuote(symbol: string, raw: RawSnapshot): AlpacaQuote | null {
  const latest = snapshotPrice(raw)
  if (!latest) return null

  const daily = raw.dailyBar
  // Yesterday's close is the denominator for the day's move. Without it the
  // only honest answer is a flat change, never a guess from the open.
  const previousClose = raw.prevDailyBar?.c ?? daily?.o ?? latest.price
  const change = latest.price - previousClose
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

  return {
    symbol,
    price: latest.price,
    open: daily?.o ?? latest.price,
    high: daily?.h ?? latest.price,
    low: daily?.l ?? latest.price,
    previousClose,
    change,
    changePercent,
    volume: daily?.v ?? 0,
    at: latest.at,
  }
}

/** Live quotes for many symbols in one request. Unknown symbols are dropped. */
export async function getSnapshots(
  symbols: string[],
  assetClass: AssetClass = 'equity',
): Promise<AlpacaQuote[]> {
  if (symbols.length === 0) return []
  const joined = symbols.join(',')

  const raw =
    assetClass === 'crypto'
      ? (
          await alpacaFetch<{ snapshots?: Record<string, RawSnapshot> }>(
            '/v1beta3/crypto/us/snapshots',
            { symbols: joined },
            15,
          )
        ).snapshots ?? {}
      : await alpacaFetch<Record<string, RawSnapshot>>(
          '/v2/stocks/snapshots',
          { symbols: joined },
          15,
        )

  return symbols
    .map((symbol) => toQuote(symbol, raw[symbol] ?? {}))
    .filter((quote): quote is AlpacaQuote => quote !== null)
}

export async function getSnapshot(
  symbol: string,
  assetClass: AssetClass = 'equity',
): Promise<AlpacaQuote> {
  const [quote] = await getSnapshots([symbol], assetClass)
  if (!quote) {
    throw new AlpacaError('upstream-error', `Alpaca returned no snapshot for ${symbol}.`)
  }
  return quote
}

/**
 * ---------------------------------------------------------------------------
 * Asset catalogue -- reference data from the trading host.
 *
 * 14,307 active US equities on this account as of 2026-09-11, of which 13,434
 * are tradable and 8,483 of those list on NASDAQ or NYSE. The full payload is
 * several megabytes, so it is cached for a day and filtered server-side --
 * never shipped to the browser whole.
 * ---------------------------------------------------------------------------
 */

export type AlpacaAsset = {
  symbol: string
  name: string
  exchange: string
  assetClass: AssetClass
  tradable: boolean
  /** Whether Alpaca supports fractional quantities, which Papaldo mirrors. */
  fractionable: boolean
  shortable: boolean
}

type RawAsset = {
  symbol: string
  name: string
  exchange: string
  class: string
  status: string
  tradable: boolean
  fractionable: boolean
  shortable: boolean
}

function toAsset(raw: RawAsset): AlpacaAsset {
  return {
    symbol: raw.symbol,
    name: raw.name,
    exchange: raw.exchange,
    assetClass: raw.class === 'crypto' ? 'crypto' : 'equity',
    tradable: raw.tradable,
    fractionable: raw.fractionable,
    shortable: raw.shortable,
  }
}

/** One asset's reference record: official name, venue, and what it permits. */
export async function getAsset(symbol: string): Promise<AlpacaAsset> {
  const raw = await alpacaFetch<RawAsset>(
    `/v2/assets/${encodeURIComponent(symbol)}`,
    {},
    86400,
    ALPACA_TRADING_URL,
  )
  return toAsset(raw)
}

/**
 * Active, tradable assets on the major venues.
 *
 * `exchanges` exists because the unfiltered list is mostly OTC warrants and
 * shells -- the first entry Alpaca returns is a Chicken Soup for the Soul
 * warrant. Defaulting to NASDAQ and NYSE keeps the browsable universe to
 * names a learner would recognise without hardcoding a curated ticker list.
 *
 * **Uncached on purpose, and expensive: 8.5MB over the wire.** Next's data
 * cache rejects anything over 2MB, and per-exchange requests are still 2.5MB
 * for NASDAQ alone, so there is no payload shape that fits. Callers must not
 * invoke this per request -- `features/markets/api/assets.ts` wraps it in
 * `unstable_cache`, which caches the trimmed result (a few hundred KB)
 * instead of the raw body.
 */
export async function listTradableAssets(
  assetClass: AssetClass = 'equity',
  exchanges: string[] = ['NASDAQ', 'NYSE'],
): Promise<AlpacaAsset[]> {
  const raw = await alpacaFetch<RawAsset[]>(
    '/v2/assets',
    { status: 'active', asset_class: assetClass === 'crypto' ? 'crypto' : 'us_equity' },
    0,
    ALPACA_TRADING_URL,
  )

  return raw
    .filter((asset) => asset.tradable)
    .filter((asset) => exchanges.length === 0 || exchanges.includes(asset.exchange))
    .map(toAsset)
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
}
