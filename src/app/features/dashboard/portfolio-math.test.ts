import { describe, expect, it } from 'vitest'

import { calendarDays, reconstructHistory, sectorAllocation, valuePortfolio, type Fill } from './portfolio-math'

describe('valuePortfolio', () => {
  const positions = [
    { symbol: 'AAPL', assetClass: 'equity' as const, quantity: 10, avgCost: 100 },
    { symbol: 'KO', assetClass: 'equity' as const, quantity: 5, avgCost: 60 },
  ]
  const sectors = new Map([['AAPL', 'Technology'], ['KO', 'FMCG']])

  it('prices live positions and totals with cash', () => {
    const v = valuePortfolio(1000, positions, new Map([['AAPL', { price: 110, change: 2 }], ['KO', { price: 50, change: -1 }]]), sectors)
    expect(v.holdingsValue).toBe(1100 + 250)
    expect(v.total).toBe(2350)
    expect(v.dayChange).toBe(20 - 5)
    // Yesterday was 2350 - 15 = 2335.
    expect(v.dayChangePercent).toBeCloseTo((15 / 2335) * 100)
    expect(v.positions.map((p) => p.symbol)).toEqual(['AAPL', 'KO'])
    expect(v.positions[1].unrealized).toBe(-50)
    expect(v.live).toBe(true)
  })

  it('carries an unpriced position at cost and says so', () => {
    const v = valuePortfolio(0, positions, new Map([['AAPL', { price: 110, change: 2 }]]), sectors)
    const ko = v.positions.find((p) => p.symbol === 'KO')!
    expect(ko).toMatchObject({ price: 60, value: 300, live: false, dayChange: 0 })
    expect(v.live).toBe(false)
  })

  it('groups allocation by sector with cash as its own slice', () => {
    const v = valuePortfolio(500, positions, new Map(), sectors)
    expect(sectorAllocation(v)).toEqual([
      { name: 'Technology', value: 1000 },
      { name: 'Cash', value: 500 },
      { name: 'FMCG', value: 300 },
    ])
  })
})

describe('calendarDays', () => {
  it('is inclusive and crosses month ends', () => {
    expect(calendarDays('2026-08-30', '2026-09-02')).toEqual(['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02'])
  })
})

describe('reconstructHistory', () => {
  // Start with 1000 cash. Day 2: buy 5 @ 100 (500). Day 4: sell 2 @ 120 (240).
  // Current cash = 1000 - 500 + 240 = 740, holding 3.
  const fills: Fill[] = [
    { symbol: 'X', side: 'buy', quantity: 5, fillPrice: 100, cashAmount: 500, date: '2026-09-02' },
    { symbol: 'X', side: 'sell', quantity: 2, fillPrice: 120, cashAmount: 240, date: '2026-09-04' },
  ]
  const closes = new Map([
    ['X', new Map([['2026-09-02', 104], ['2026-09-03', 110], ['2026-09-04', 118]])],
  ])

  const points = reconstructHistory({
    currentCash: 740,
    fills,
    closes,
    start: '2026-09-01',
    end: '2026-09-06',
    liveTotal: 740 + 3 * 125,
  })

  it('undoes every fill to find the starting cash', () => {
    expect(points[0]).toEqual({ date: '2026-09-01', value: 1000 })
  })

  it('prices held quantity at each day’s close', () => {
    expect(points.map((p) => p.value).slice(1, 4)).toEqual([500 + 5 * 104, 500 + 5 * 110, 740 + 3 * 118])
  })

  it('carries the last close over days with no bar', () => {
    expect(points[4]).toEqual({ date: '2026-09-05', value: 740 + 3 * 118 })
  })

  it('ends on the live total', () => {
    expect(points.at(-1)).toEqual({ date: '2026-09-06', value: 1115 })
  })

  it('keeps the reconstructed last point when no live total is given', () => {
    const offline = reconstructHistory({ currentCash: 740, fills, closes, start: '2026-09-01', end: '2026-09-06' })
    expect(offline.at(-1)).toEqual({ date: '2026-09-06', value: 740 + 3 * 118 })
  })

  it('marks a position to its latest fill when there are no bars', () => {
    // Buy 10 @ 100 then 10 @ 110 from 3000 cash: 3000 - 1000 - 1100 = 900 left.
    const history = reconstructHistory({
      currentCash: 900,
      fills: [
        { symbol: 'Z', side: 'buy', quantity: 10, fillPrice: 100, cashAmount: 1000, date: '2026-09-01' },
        { symbol: 'Z', side: 'buy', quantity: 10, fillPrice: 110, cashAmount: 1100, date: '2026-09-02' },
      ],
      closes: new Map(),
      start: '2026-09-01',
      end: '2026-09-02',
    })
    expect(history.map((p) => p.value)).toEqual([900 + 1100 + 10 * 100, 900 + 20 * 110])
  })

  it('falls back to the fill price before a symbol has any bar', () => {
    const early = reconstructHistory({
      currentCash: 500,
      fills: [{ symbol: 'Y', side: 'buy', quantity: 5, fillPrice: 100, cashAmount: 500, date: '2026-09-01' }],
      closes: new Map(),
      start: '2026-09-01',
      end: '2026-09-02',
      liveTotal: 1000,
    })
    expect(early[0].value).toBe(1000)
  })
})
