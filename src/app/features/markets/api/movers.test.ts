import { describe, expect, it } from 'vitest'

import { sectorMoves, topMovers, type UniverseQuote } from './movers'

function quote(symbol: string, changePercent: number, sector = 'Technology'): UniverseQuote {
  return {
    symbol,
    name: symbol,
    sector,
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

describe('topMovers', () => {
  const quotes = [quote('A', 3), quote('B', -2), quote('C', 0), quote('D', 5), quote('E', -4)]

  it('ranks gainers biggest first and losers biggest drop first', () => {
    const { gainers, losers } = topMovers(quotes, 5)
    expect(gainers.map((q) => q.symbol)).toEqual(['D', 'A'])
    expect(losers.map((q) => q.symbol)).toEqual(['E', 'B'])
  })

  it('never counts an unchanged name as a mover', () => {
    const { gainers, losers } = topMovers(quotes, 5)
    expect([...gainers, ...losers].map((q) => q.symbol)).not.toContain('C')
  })

  it('caps each list at the requested count', () => {
    expect(topMovers(quotes, 1)).toMatchObject({ gainers: [{ symbol: 'D' }], losers: [{ symbol: 'E' }] })
  })
})

describe('sectorMoves', () => {
  it('averages each sector with equal weights', () => {
    const moves = sectorMoves([quote('A', 2, 'ETF'), quote('B', -1, 'ETF'), quote('C', 4, 'FMCG')])
    expect(moves.find((m) => m.sector === 'ETF')?.changePercent).toBeCloseTo(0.5)
    expect(moves.find((m) => m.sector === 'FMCG')?.changePercent).toBeCloseTo(4)
  })
})
