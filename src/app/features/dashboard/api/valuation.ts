import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUser } from '@/app/core/services/supabase/session'
import { getCandles } from '@/app/features/markets/api/candles'
import { getQuotes } from '@/app/features/markets/api/quotes'
import type { MarketFailure } from '@/app/features/markets/api/result'
import { getUniverse } from '@/app/features/markets/api/universe'
import type { PortfolioSummary } from '@/app/features/trading/api/portfolio'

import { reconstructHistory, valuePortfolio, type Fill, type Point, type PriceInput, type Valuation } from '../portfolio-math'

/**
 * The portfolio at live prices.
 *
 * Holdings are priced from their own quotes, not from whatever watchlist is
 * on screen -- the old dashboard did the latter, so a held symbol outside the
 * watchlist silently sat at cost. Equities and crypto are separate Alpaca
 * namespaces, hence two requests at most.
 *
 * Returns the reason when prices are unavailable so the card can say why its
 * total is carried at cost; the total itself is still shown.
 */
export const getValuation = cache(
  async (portfolio: PortfolioSummary): Promise<{ valuation: Valuation; failure: MarketFailure | null }> => {
    const equities = portfolio.holdings.filter((h) => h.assetClass === 'equity').map((h) => h.symbol)
    const crypto = portfolio.holdings.filter((h) => h.assetClass === 'crypto').map((h) => h.symbol)

    const [universe, equityQuotes, cryptoQuotes] = await Promise.all([
      getUniverse(),
      equities.length ? getQuotes(equities) : null,
      crypto.length ? getQuotes(crypto, 'crypto') : null,
    ])

    const prices = new Map<string, PriceInput>()
    let failure: MarketFailure | null = null
    for (const result of [equityQuotes, cryptoQuotes]) {
      if (!result) continue
      if (!result.ok) {
        failure = result.reason
        continue
      }
      for (const q of result.data) prices.set(q.symbol, { price: q.price, change: q.change })
    }

    const valuation = valuePortfolio(
      portfolio.cashBalance,
      portfolio.holdings,
      prices,
      new Map(universe.map((a) => [a.symbol, a.sector])),
    )
    return { valuation, failure }
  },
)

/** YYYY-MM-DD in New York -- the calendar Alpaca's daily bars are dated in. */
function newYorkDate(at: Date | string): string {
  return new Date(at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

const MAX_HISTORY_DAYS = 5 * 365

type OrderRow = {
  symbol: string
  asset_class: string
  side: string
  quantity: number
  fill_price: number
  cash_amount: number
  filled_at: string
}

/**
 * Daily account value since the account opened (capped at five years).
 * See `reconstructHistory` for how a history nobody stored is rebuilt.
 *
 * Only symbols that were ever traded need bars, and each request is cached
 * by the Alpaca wrapper for 15 minutes, so this stays cheap however often the
 * dashboard is opened.
 */
export async function getPerformanceHistory(portfolio: PortfolioSummary, valuation: Valuation): Promise<Point[]> {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) return []

  const [{ data: account }, { data: orders }] = await Promise.all([
    supabase.from('portfolios').select('created_at').eq('user_id', user.id).maybeSingle(),
    // RLS scopes orders to the caller's own portfolio.
    supabase
      .from('orders')
      .select('symbol, asset_class, side, quantity, fill_price, cash_amount, filled_at')
      .order('filled_at', { ascending: true }),
  ])

  const end = newYorkDate(new Date())
  const earliest = newYorkDate(new Date(Date.now() - MAX_HISTORY_DAYS * 86_400_000))
  const opened = account?.created_at ? newYorkDate(account.created_at) : end
  const start = opened < earliest ? earliest : opened

  const rows = (orders ?? []) as OrderRow[]
  const fills: Fill[] = rows.map((row) => ({
    symbol: row.symbol,
    side: row.side === 'sell' ? 'sell' : 'buy',
    quantity: Number(row.quantity),
    fillPrice: Number(row.fill_price),
    cashAmount: Number(row.cash_amount),
    date: newYorkDate(row.filled_at),
  }))

  const traded = new Map(rows.map((row) => [row.symbol, row.asset_class === 'crypto' ? 'crypto' : 'equity'] as const))
  const days = Math.ceil((Date.parse(end) - Date.parse(start)) / 86_400_000) + 7
  const bars = await Promise.all(
    [...traded.entries()].map(async ([symbol, assetClass]) => {
      const result = await getCandles(symbol, assetClass, days)
      return [symbol, new Map(result.ok ? result.data.map((c) => [c.time, c.close]) : [])] as const
    }),
  )

  return reconstructHistory({
    currentCash: portfolio.cashBalance,
    fills,
    closes: new Map(bars),
    start,
    end,
    liveTotal: valuation.live ? valuation.total : undefined,
  })
}
