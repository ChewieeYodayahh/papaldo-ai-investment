import 'server-only'

import { cache } from 'react'

import { getMonthlyBars } from '@/app/core/services/alpaca'
import { createClient } from '@/app/core/services/supabase/server'

import type { MonthlyPoint } from '../math'

export type AssetGroup = 'index' | 'fund' | 'stock'
export type AssetOption = { value: string; label: string; group: AssetGroup }

/** The four indices the benchmarker tracks, keyed as public.market_benchmarks stores them. */
export const INDEX_OPTIONS: AssetOption[] = [
  { value: 'PSEI', label: 'PSEi', group: 'index' },
  { value: 'NYSE', label: 'NYSE Composite', group: 'index' },
  { value: 'NASDAQ', label: 'NASDAQ Composite', group: 'index' },
  { value: 'SP500', label: 'S&P 500', group: 'index' },
]

/** Everything the calculator can replay: the indices, then the buyable funds and stocks. */
export const getAssetOptions = cache(async (): Promise<AssetOption[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tradable_assets')
    .select('symbol, name, sector, asset_class')
    .eq('active', true)
    .eq('asset_class', 'equity')
    .order('symbol')

  if (error || !data) {
    console.error('[calculators] asset list unavailable:', error?.message)
    return INDEX_OPTIONS
  }

  const funds = data.filter((a) => a.sector === 'ETF')
  const stocks = data.filter((a) => a.sector !== 'ETF')
  return [
    ...INDEX_OPTIONS,
    ...funds.map((a): AssetOption => ({ value: a.symbol, label: `${a.symbol} · ${a.name}`, group: 'fund' })),
    ...stocks.map((a): AssetOption => ({ value: a.symbol, label: `${a.symbol} · ${a.name}`, group: 'stock' })),
  ]
})

export type HistoryResult =
  | { ok: true; asset: string; label: string; points: MonthlyPoint[]; source: 'benchmarks' | 'alpaca' }
  | { ok: false; message: string }

/**
 * Monthly closes for one option. Indices come from the benchmarker's own
 * table (15 years); funds and stocks from Alpaca (about 10 years on the free
 * plan). Only symbols in the buyable universe are accepted, so this can't be
 * used to fetch arbitrary tickers.
 */
export async function getHistory(asset: string): Promise<HistoryResult> {
  const key = asset.trim().toUpperCase()
  const index = INDEX_OPTIONS.find((option) => option.value === key)
  const supabase = await createClient()

  if (index) {
    const { data, error } = await supabase
      .from('market_benchmarks')
      .select('price_date, raw_close_price')
      .eq('ticker', index.value)
      .order('price_date')
    if (error || !data?.length) return { ok: false, message: 'Index history is not available right now.' }
    return {
      ok: true,
      asset: index.value,
      label: index.label,
      source: 'benchmarks',
      points: data.map((row) => ({ date: row.price_date, close: Number(row.raw_close_price) })),
    }
  }

  const { data: listed } = await supabase
    .from('tradable_assets')
    .select('symbol, name')
    .eq('symbol', key)
    .eq('active', true)
    .eq('asset_class', 'equity')
    .maybeSingle()
  if (!listed) return { ok: false, message: `${key} is not in Papaldo’s universe.` }

  try {
    const bars = await getMonthlyBars(listed.symbol, 10)
    if (bars.length < 2) return { ok: false, message: `Not enough history for ${listed.symbol} yet.` }
    return {
      ok: true,
      asset: listed.symbol,
      label: `${listed.symbol} · ${listed.name}`,
      source: 'alpaca',
      points: bars.map((bar) => ({ date: bar.time, close: bar.close })),
    }
  } catch (error) {
    console.error('[calculators] monthly bars failed:', error)
    return { ok: false, message: `Price history for ${listed.symbol} could not be loaded. Try again in a minute.` }
  }
}
