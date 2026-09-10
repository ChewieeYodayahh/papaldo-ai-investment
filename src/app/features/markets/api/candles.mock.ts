import 'server-only'

import type { FinnhubQuote } from '@/app/core/services/finnhub'

/**
 * ===========================================================================
 * PLACEHOLDER PRICE HISTORY — SYNTHETIC. NOT MARKET DATA. REPLACE ME.
 * ===========================================================================
 *
 * Why this file exists: Finnhub's free plan answers 403 on `/stock/candle`,
 * so there is no historical OHLC series to draw. Carlos's call (2026-09-10):
 * ship a mock chart now, wire a real provider (Alpaca is the candidate) later.
 *
 * How to replace it, in one step: write a module that exports the same
 * `getCandles(symbol, quote)` signature returning `Candle[]`, point
 * `features/markets/pages/symbol.page.tsx` at it, and delete this file. The
 * `Candle` shape below is deliberately provider-neutral — Alpaca's bars
 * (`t/o/h/l/c`) map onto it directly.
 *
 * Two properties keep this honest while it lasts:
 *
 * 1. **The last candle is real.** Today's open, high, low and current price
 *    come from the live Finnhub quote, so the right edge of the chart agrees
 *    with the price in the page header. Only the bars before today are made up.
 * 2. **It is deterministic.** The walk is seeded from the symbol, so the same
 *    ticker always draws the same history — server and client render
 *    identically, and the chart does not reshuffle on every reload.
 *
 * Every surface that renders this must say it is sample data. See
 * `PriceChart.tsx` and the `SAMPLE_DATA` precedent in
 * `features/markets/pages/markets.page.tsx`.
 */

export type Candle = {
  /** ISO date, read by lightweight-charts as a BusinessDay. */
  time: string
  open: number
  high: number
  low: number
  close: number
}

/** Where a candle series came from. Drives the "sample data" labelling. */
export type CandleSource = 'sample' | 'live'

export type CandleSeries = {
  candles: Candle[]
  source: CandleSource
}

const TRADING_DAYS = 260

/** mulberry32 — small, fast, deterministic. Any seeded PRNG would do. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFor(symbol: string): number {
  let hash = 2166136261
  for (const char of symbol) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Weekdays only, oldest first, ending today. Holidays are not modelled. */
function tradingDaysBackFrom(end: Date, count: number): string[] {
  const days: string[] = []
  const cursor = new Date(end)
  while (days.length < count) {
    const weekday = cursor.getUTCDay()
    if (weekday !== 0 && weekday !== 6) days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return days.reverse()
}

/**
 * A plausible-looking year of daily bars ending at the real quote.
 *
 * The walk runs backwards from today's real close so the series lands exactly
 * on the live price instead of drifting away from it. Volatility scales with
 * price so a $300 stock and a $30 stock both look reasonable.
 */
export function getCandles(symbol: string, quote: FinnhubQuote): CandleSeries {
  const random = seededRandom(seedFor(symbol))
  const dates = tradingDaysBackFrom(new Date(), TRADING_DAYS)

  // Daily closes, newest first, walking backwards from the real last price.
  const closes: number[] = [quote.current]
  const dailyVolatility = 0.014
  const drift = 0.0004
  for (let i = 1; i < dates.length; i += 1) {
    const shock = (random() - 0.5) * 2 * dailyVolatility
    const previous = closes[i - 1] / (1 + drift + shock)
    closes.push(Math.max(previous, 0.5))
  }
  closes.reverse()

  const candles: Candle[] = dates.map((time, i) => {
    const close = closes[i]
    const open = i === 0 ? close * (1 - (random() - 0.5) * dailyVolatility) : closes[i - 1]
    const spread = close * dailyVolatility * (0.5 + random())
    return {
      time,
      open: round(open),
      high: round(Math.max(open, close) + spread * random()),
      low: round(Math.min(open, close) - spread * random()),
      close: round(close),
    }
  })

  // Today's bar is the one piece of real OHLC the quote endpoint does give us.
  const today = candles[candles.length - 1]
  if (today && quote.open > 0 && quote.high > 0 && quote.low > 0) {
    candles[candles.length - 1] = {
      time: today.time,
      open: round(quote.open),
      high: round(quote.high),
      low: round(quote.low),
      close: round(quote.current),
    }
  }

  return { candles, source: 'sample' }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
