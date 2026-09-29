import { describe, expect, it } from 'vitest'

import type { UniverseQuote } from './api/movers'
import { buildHeatmap, colorStep, formatCap, stepFill } from './heatmap'

function quote(symbol: string, sector: string, changePercent: number, marketCapUsd: number | null): UniverseQuote {
  return {
    symbol,
    name: symbol,
    sector,
    marketCapUsd,
    price: 100,
    open: 100,
    high: 100,
    low: 100,
    previousClose: 100,
    change: changePercent,
    changePercent,
    volume: 0,
    at: '2026-09-25T00:00:00Z',
  }
}

const QUOTES = [
  quote('BIG', 'Technology', 1, 900),
  quote('SMALL', 'Technology', -9, 100),
  quote('NEW', 'Technology', 2, null),
  quote('BANK', 'Finance', -1, 50),
  quote('VOO', 'ETF', 5, null),
]

describe('buildHeatmap', () => {
  const sectors = buildHeatmap(QUOTES)

  it('shows stocks only, grouped by sector, biggest sector first', () => {
    expect(sectors.map((s) => s.sector)).toEqual(['Technology', 'Finance'])
    expect(sectors.flatMap((s) => s.tiles.map((t) => t.symbol))).not.toContain('VOO')
  })

  it('sizes tiles by market cap, largest first', () => {
    expect(sectors[0].tiles.map((t) => t.symbol)).toEqual(['BIG', 'NEW', 'SMALL'])
  })

  it('gives a stock without a cap its sector median, and says so', () => {
    const fresh = sectors[0].tiles.find((t) => t.symbol === 'NEW')!
    expect(fresh.size).toBe(500)
    expect(fresh.estimatedSize).toBe(true)
  })

  it('weights the sector move by cap, not equally', () => {
    // (900*1 + 500*2 + 100*-9) / 1500 = 0.6667, where an equal mean would be -2.
    expect(sectors[0].changePercent).toBeCloseTo(1000 / 1500, 6)
  })
})

describe('colour scale', () => {
  it('rounds to whole-percent bands and caps at +/-3', () => {
    expect([-7, -2.6, -0.4, 0, 0.49, 0.5, 1.4, 2.5, 12].map(colorStep)).toEqual([-3, -3, 0, 0, 0, 1, 1, 3, 3])
  })

  it('fills from the heat tokens only: red, grey at zero, green', () => {
    expect([-3, -2, -1, 0, 1, 2, 3].map(stepFill)).toEqual([
      'var(--heat-n3)',
      'var(--heat-n2)',
      'var(--heat-n1)',
      'var(--heat-0)',
      'var(--heat-p1)',
      'var(--heat-p2)',
      'var(--heat-p3)',
    ])
    expect(stepFill(9)).toBe('var(--heat-p3)')
    expect(stepFill(-0)).toBe('var(--heat-0)')
  })

  it('formats market caps compactly', () => {
    expect(formatCap(3.21e12)).toBe('3.21T')
    expect(formatCap(845e9)).toBe('845B')
    expect(formatCap(12.44e9)).toBe('12.4B')
    expect(formatCap(450e6)).toBe('450M')
  })
})
