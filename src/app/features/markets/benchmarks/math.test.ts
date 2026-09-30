import { describe, expect, it } from 'vitest'

import { lastMonths, pivot, rebase, summarize, type BenchmarkRow } from './math'

function row(date: string, ticker: BenchmarkRow['ticker'], normalized: number, yoy: number | null = null): BenchmarkRow {
  return {
    price_date: date,
    ticker,
    source_symbol: ticker,
    raw_close_price: normalized * 10,
    normalized_growth_value: normalized,
    yoy_return_pct: yoy,
  }
}

const ROWS: BenchmarkRow[] = [
  row('2024-01-01', 'SP500', 100, 5),
  row('2024-01-01', 'PSEI', 100, -2),
  row('2024-02-01', 'SP500', 110, 6),
  row('2024-02-01', 'PSEI', 90, -3),
  row('2024-03-01', 'SP500', 121, 7),
  row('2024-03-01', 'PSEI', 99, null),
]

describe('pivot', () => {
  it('groups rows by month, oldest first, one key per index', () => {
    const growth = pivot([...ROWS].reverse(), 'normalized_growth_value')
    expect(growth).toEqual([
      { date: '2024-01-01', SP500: 100, PSEI: 100 },
      { date: '2024-02-01', SP500: 110, PSEI: 90 },
      { date: '2024-03-01', SP500: 121, PSEI: 99 },
    ])
  })

  it('keeps a missing YoY as null rather than zero', () => {
    expect(pivot(ROWS, 'yoy_return_pct').at(-1)).toEqual({ date: '2024-03-01', SP500: 7, PSEI: null })
  })
})

describe('rebase', () => {
  it('restarts every line at 100 and keeps the ratios', () => {
    const rebased = rebase(lastMonths(pivot(ROWS, 'normalized_growth_value'), 1))
    expect(rebased[0]).toMatchObject({ SP500: 100, PSEI: 100 })
    expect(rebased[1].SP500).toBeCloseTo(110)
    expect(rebased[1].PSEI).toBeCloseTo(110)
  })
})

describe('summarize', () => {
  const growth = pivot(ROWS, 'normalized_growth_value')
  const yoy = pivot(ROWS, 'yoy_return_pct')

  it('reports total gain from 100', () => {
    expect(summarize(growth, yoy, 'SP500')?.totalGainPct).toBeCloseTo(21)
    expect(summarize(growth, yoy, 'PSEI')?.totalGainPct).toBeCloseTo(-1)
  })

  it('annualises with CAGR over the number of months', () => {
    // +10% a month for 2 months, compounded to a year: 1.1^12 - 1.
    expect(summarize(growth, yoy, 'SP500')?.cagrPct).toBeCloseTo((1.1 ** 12 - 1) * 100, 6)
  })

  it('reports zero volatility for a perfectly steady climb', () => {
    expect(summarize(growth, yoy, 'SP500')?.volatilityPct).toBeCloseTo(0, 10)
    expect(summarize(growth, yoy, 'PSEI')?.volatilityPct).toBeGreaterThan(0)
  })

  it('takes the latest YoY that exists', () => {
    expect(summarize(growth, yoy, 'SP500')?.latestYoyPct).toBe(7)
    expect(summarize(growth, yoy, 'PSEI')?.latestYoyPct).toBe(-3)
  })

  it('needs at least two months', () => {
    expect(summarize(growth.slice(0, 1), yoy, 'SP500')).toBeNull()
  })
})
