import 'server-only'

import { getDailyBars, type AlpacaBar } from '@/app/core/services/alpaca'
import { createClient } from '@/app/core/services/supabase/server'

const MAX_DAYS = 5 * 365

export type BarsResult = { ok: true; symbol: string; bars: AlpacaBar[] } | { ok: false; status: number; message: string }

/**
 * Daily OHLCV bars for the export tool's price-history file, like
 * MetaTrader's bar export. Only symbols in Papaldo's universe.
 */
export async function getExportBars(rawSymbol: string, rawDays: number): Promise<BarsResult> {
  const symbol = rawSymbol.trim().toUpperCase()
  const days = Math.min(MAX_DAYS, Math.max(5, rawDays || 365))

  const supabase = await createClient()
  const { data: listed } = await supabase
    .from('tradable_assets')
    .select('symbol, asset_class')
    .eq('symbol', symbol)
    .eq('active', true)
    .maybeSingle()
  if (!listed) return { ok: false, status: 404, message: `${symbol || 'That symbol'} is not in Papaldo’s universe.` }

  try {
    const bars = await getDailyBars(listed.symbol, listed.asset_class === 'crypto' ? 'crypto' : 'equity', days)
    return { ok: true, symbol: listed.symbol, bars }
  } catch (error) {
    console.error('[export] daily bars failed:', error)
    return { ok: false, status: 502, message: 'Price history could not be loaded. Try again in a minute.' }
  }
}
