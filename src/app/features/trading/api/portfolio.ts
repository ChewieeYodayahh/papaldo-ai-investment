import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'

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
 * Every account gets exactly one portfolio row, seeded with a $500,000 USD
 * demo cash balance by the `on_auth_user_created_portfolio` trigger at signup,
 * so a null return here means "not signed in," never "no portfolio yet."
 * `holdings` is written by `place_order` and by nothing else.
 */
export async function getPortfolio(): Promise<PortfolioSummary | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
