import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUser } from '@/app/core/services/supabase/session'

export type Holding = {
  id: string
  symbol: string
  /** Which Alpaca namespace prices this position. */
  assetClass: 'equity' | 'crypto'
  quantity: number
  avgCost: number
}

export type PortfolioSummary = {
  cashBalance: number
  currency: string
  holdings: Holding[]
}

/**
 * The signed-in user's portfolio + holdings, or null if not signed in.
 *
 * Lives in `trading` because trading owns the money: `place_order()` is the
 * only thing that may change either number, and the dashboard is a reader.
 *
 * Every account gets exactly one portfolio row, seeded with demo cash by the
 * `on_auth_user_created_portfolio` trigger at signup ($100,000 USD since
 * 2026-09-30; older accounts started with $500,000),
 * so a null return here means "not signed in," never "no portfolio yet."
 * `holdings` is written by `place_order` and by nothing else.
 */
export async function getPortfolio(): Promise<PortfolioSummary | null> {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) return null

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id, cash_balance, currency')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!portfolio) return null

  const { data: holdings } = await supabase
    .from('holdings')
    .select('id, symbol, asset_class, quantity, avg_cost')
    .eq('portfolio_id', portfolio.id)

  return {
    cashBalance: portfolio.cash_balance,
    currency: portfolio.currency,
    holdings: (holdings ?? []).map((h) => ({
      id: h.id,
      symbol: h.symbol,
      assetClass: h.asset_class === 'crypto' ? ('crypto' as const) : ('equity' as const),
      quantity: h.quantity,
      avgCost: h.avg_cost,
    })),
  }
}

/**
 * What the signed-in account started with, derived by the database as
 * cash + buys - sells (`my_starting_cash()`, under the caller's RLS). Exact for
 * old $500,000 and new $100,000 accounts alike; null when signed out.
 */
export async function getStartingCash(): Promise<number | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('my_starting_cash')
  if (error) {
    console.error('[trading] starting cash unavailable:', error.message)
    return null
  }
  return data === null ? null : Number(data)
}
