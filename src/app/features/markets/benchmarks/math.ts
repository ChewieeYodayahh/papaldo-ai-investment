/**
 * Stock Exchange Index Benchmarker -- the maths the app does on top of what
 * python/benchmarks.py stored. Pure, so it is unit tested directly.
 *
 * The pipeline already did the heavy lifting: every index is normalised to
 * 100 at the 15-year window's first month, and each month carries a rolling
 * 12-month YoY. What is left here:
 *
 *   pivot      rows per (month, index)  ->  one row per month, one key per
 *              index -- the shape a multi-line chart wants.
 *   rebase     a shorter range (5Y, 10Y) restarts every line at 100 on its
 *              own first month. Normalised values are ratios, so
 *                  rebased_t = normalized_t / normalized_start * 100
 *              equals close_t / close_start * 100 exactly -- no raw prices
 *              needed.
 *   summarize  per index over the visible range:
 *                  total gain  = last / 100 - 1
 *                  CAGR        = (last / 100) ^ (12 / months) - 1
 *                  volatility  = stdev(monthly returns) * sqrt(12)
 *              CAGR is the constant yearly rate that turns 100 into `last`
 *              over the same number of months; volatility annualises the
 *              month-to-month swing (sample standard deviation).
 */

export const INDEX_KEYS = ['PSEI', 'NYSE', 'NASDAQ', 'SP500'] as const
export type IndexKey = (typeof INDEX_KEYS)[number]

/** One stored row of public.market_benchmarks. */
export type BenchmarkRow = {
  price_date: string
  ticker: IndexKey
  source_symbol: string
  raw_close_price: number
  normalized_growth_value: number
  yoy_return_pct: number | null
}

/** One month, one value per index -- `{ date: '2026-09-01', PSEI: 109.8, SP500: 684.4, ... }`. */
export type ChartRow = { date: string } & Partial<Record<IndexKey, number | null>>

export type IndexSummary = {
  key: IndexKey
  /** Where the line ends on the visible range, starting from 100. */
  last: number
  totalGainPct: number
  cagrPct: number
  volatilityPct: number
  latestYoyPct: number | null
}

type Field = 'normalized_growth_value' | 'yoy_return_pct'

/** Rows per (month, index) -> one row per month, oldest first. */
export function pivot(rows: BenchmarkRow[], field: Field): ChartRow[] {
  const byDate = new Map<string, ChartRow>()
  for (const row of rows) {
    const entry = byDate.get(row.price_date) ?? { date: row.price_date }
    const value = row[field]
    entry[row.ticker] = value === null ? null : Number(value)
    byDate.set(row.price_date, entry)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** The last `months` + 1 points (so `months` of change), or everything. */
export function lastMonths<T>(rows: T[], months: number): T[] {
  return Number.isFinite(months) ? rows.slice(-(months + 1)) : rows
}

/** Restart every index at 100 on the first row. */
export function rebase(growth: ChartRow[]): ChartRow[] {
  const first = growth[0]
  if (!first) return []
  return growth.map((row) => {
    const next: ChartRow = { date: row.date }
    for (const key of INDEX_KEYS) {
      const start = first[key]
      const value = row[key]
      next[key] = start && value != null ? (value / start) * 100 : null
    }
    return next
  })
}

function sampleStdev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Figures for one index over a rebased range. `yoy` supplies the latest
 * rolling-YoY value, which does not depend on the range.
 */
export function summarize(rebased: ChartRow[], yoy: ChartRow[], key: IndexKey): IndexSummary | null {
  const values = rebased.map((row) => row[key]).filter((v): v is number => typeof v === 'number')
  if (values.length < 2) return null

  const last = values[values.length - 1]
  const months = values.length - 1
  const returns = values.slice(1).map((v, i) => v / values[i] - 1)
  const latestYoy = [...yoy].reverse().find((row) => typeof row[key] === 'number')?.[key]

  return {
    key,
    last,
    totalGainPct: (last / 100 - 1) * 100,
    cagrPct: (Math.pow(last / 100, 12 / months) - 1) * 100,
    volatilityPct: sampleStdev(returns) * Math.sqrt(12) * 100,
    latestYoyPct: typeof latestYoy === 'number' ? latestYoy : null,
  }
}
