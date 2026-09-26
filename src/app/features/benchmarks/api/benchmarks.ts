import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'

import { INDEX_KEYS, pivot, type BenchmarkRow, type ChartRow, type IndexKey } from '../math'

export type IndexMeta = {
  key: IndexKey
  label: string
  /** The series actually stored: `^GSPC`, `stooq:^psei`, or `EPHE` for the PSEi proxy. */
  sourceSymbol: string
  /** True when the line is a stand-in for the named index (PSEi via EPHE). */
  isProxy: boolean
}

export type BenchmarksPayload = {
  /** Latest month in the table, or null when the pipeline has not run. */
  asOf: string | null
  indexes: IndexMeta[]
  /** One row per month: every index normalised to 100 at the window start. */
  growth: ChartRow[]
  /** One row per month: rolling 12-month YoY, in percent. */
  yoy: ChartRow[]
}

const LABELS: Record<IndexKey, string> = {
  PSEI: 'PSEi',
  NYSE: 'NYSE Composite',
  NASDAQ: 'NASDAQ Composite',
  SP500: 'S&P 500',
}

/**
 * The benchmarker's data, as `python/benchmarks.py` stored it, pivoted by
 * month for charting.
 *
 * The table holds one 15-year window (181 months x 4 indices -- the pipeline
 * prunes older months), comfortably under PostgREST's 1,000-row page, so one
 * request reads it all. `cache()` shares it between the page and the Tools
 * card on the same render.
 */
export const getBenchmarks = cache(async (): Promise<BenchmarksPayload> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('market_benchmarks')
    .select('price_date, ticker, source_symbol, raw_close_price, normalized_growth_value, yoy_return_pct')
    .order('price_date')

  if (error) {
    console.error('[benchmarks] read failed:', error.message)
  }

  const rows = (data ?? []).filter((row): row is BenchmarkRow =>
    (INDEX_KEYS as readonly string[]).includes(row.ticker),
  )

  const latestSource = new Map<IndexKey, string>()
  for (const row of rows) latestSource.set(row.ticker, row.source_symbol)

  const indexes: IndexMeta[] = INDEX_KEYS.filter((key) => latestSource.has(key)).map((key) => {
    const sourceSymbol = latestSource.get(key)!
    return { key, label: LABELS[key], sourceSymbol, isProxy: key === 'PSEI' && sourceSymbol === 'EPHE' }
  })

  const growth = pivot(rows, 'normalized_growth_value')
  return {
    asOf: growth.at(-1)?.date ?? null,
    indexes,
    growth,
    yoy: pivot(rows, 'yoy_return_pct'),
  }
})
