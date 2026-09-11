import 'server-only'

import { getLatestPrice } from '@/app/core/services/alpaca'
import { createClient } from '@/app/core/services/supabase/server'

import { orderSchema, type OrderInput } from '../schema'
import type { Order, OrderResult } from '../types'

/**
 * Simulated order placement.
 *
 * Two halves, both server-side. The price comes from Alpaca here, never from
 * the request body -- a browser that names its own fill price names its own
 * profit. The money then moves inside `place_order()`, one Postgres function
 * that locks the portfolio row, checks funds or holdings, updates cash and
 * position, and writes the order, all in one transaction. `authenticated` has
 * no INSERT or UPDATE grant on `portfolios`, `holdings` or `orders`, so that
 * function is the only way any of them can change.
 *
 * Nothing reaches a broker. Alpaca is read for a price and nothing else.
 */

/**
 * SQLSTATEs raised by `place_order`, mapped to what the user should read.
 * The database owns the rules; this owns the wording.
 */
const ORDER_ERRORS: Record<string, string> = {
  PA001: 'Not enough cash for that order.',
  PA002: 'You do not hold enough of that to sell.',
  PA003: 'No portfolio found for this account.',
  PA004: 'You are not signed in.',
  PA005: 'That order is not valid.',
}

type OrderRow = {
  id: string
  symbol: string
  asset_class: string
  side: string
  quantity: number
  fill_price: number
  cash_amount: number
  filled_at: string
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    symbol: row.symbol,
    assetClass: row.asset_class === 'crypto' ? 'crypto' : 'equity',
    side: row.side === 'sell' ? 'sell' : 'buy',
    quantity: Number(row.quantity),
    fillPrice: Number(row.fill_price),
    cashAmount: Number(row.cash_amount),
    filledAt: row.filled_at,
  }
}

export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  const parsed = orderSchema.parse(input)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'You are not signed in.' }

  // Price first. If the market data call fails there is no fill, and nothing
  // in the database has been touched.
  let fillPrice: number
  try {
    const latest = await getLatestPrice(parsed.symbol, parsed.assetClass)
    fillPrice = latest.price
  } catch {
    return {
      ok: false,
      message: 'Could not get a live price for that symbol, so no order was placed.',
    }
  }

  const { data, error } = await supabase
    .rpc('place_order', {
      p_symbol: parsed.symbol,
      p_asset_class: parsed.assetClass,
      p_side: parsed.side,
      p_quantity: parsed.quantity,
      p_fill_price: fillPrice,
    })
    .single<OrderRow>()

  if (error || !data) {
    const message = ORDER_ERRORS[error?.code ?? ''] ?? 'That order could not be placed.'
    return {
      ok: false,
      message,
      // Point the form at the field the rule is about, so the message lands
      // next to the input the user has to change.
      fieldErrors:
        error?.code === 'PA001' || error?.code === 'PA002' ? { quantity: message } : undefined,
    }
  }

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('cash_balance')
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    ok: true,
    order: toOrder(data),
    cashBalance: Number(portfolio?.cash_balance ?? 0),
  }
}

/**
 * The signed-in user's fills, newest first. RLS scopes this to their own
 * portfolio, so no ownership filter is needed here and adding one would only
 * imply the policy is not trusted.
 */
export async function getOrderHistory(limit = 20): Promise<Order[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('orders')
    .select('id, symbol, asset_class, side, quantity, fill_price, cash_amount, filled_at')
    .order('filled_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((row) => toOrder(row as OrderRow))
}
