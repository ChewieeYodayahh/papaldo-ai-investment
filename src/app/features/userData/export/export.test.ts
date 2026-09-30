import { describe, expect, it } from 'vitest'

import { csvCell, htmlReport, toCsv } from './formats'
import { maxDrawdownPct, summarize, withRealizedPnl, type TradeInput } from './metrics'

function trade(partial: Partial<TradeInput> & Pick<TradeInput, 'side' | 'quantity' | 'fillPrice' | 'filledAt'>): TradeInput {
  return {
    id: partial.filledAt,
    symbol: 'AAPL',
    cashAmount: partial.quantity * partial.fillPrice,
    ...partial,
  }
}

describe('withRealizedPnl', () => {
  it('realises (price - average cost) x quantity on each sell', () => {
    const rows = withRealizedPnl([
      trade({ side: 'buy', quantity: 10, fillPrice: 100, filledAt: '2026-01-01' }),
      trade({ side: 'buy', quantity: 10, fillPrice: 200, filledAt: '2026-01-02' }),
      trade({ side: 'sell', quantity: 5, fillPrice: 180, filledAt: '2026-01-03' }),
    ])
    // Average cost after two buys: 150. Selling 5 at 180 realises 150.
    expect(rows.map((r) => r.realizedPnl)).toEqual([null, null, 150])
    expect(rows[2].avgCostBefore).toBe(150)
  })

  it('sorts by fill time and tracks symbols separately', () => {
    const rows = withRealizedPnl([
      trade({ symbol: 'MSFT', side: 'sell', quantity: 1, fillPrice: 50, filledAt: '2026-02-02' }),
      trade({ symbol: 'MSFT', side: 'buy', quantity: 1, fillPrice: 40, filledAt: '2026-02-01' }),
      trade({ symbol: 'AAPL', side: 'buy', quantity: 1, fillPrice: 999, filledAt: '2026-01-15' }),
    ])
    expect(rows.map((r) => r.symbol)).toEqual(['AAPL', 'MSFT', 'MSFT'])
    expect(rows[2].realizedPnl).toBe(10)
  })
})

describe('summarize', () => {
  it('computes win rate, profit factor and extremes from sells', () => {
    const rows = withRealizedPnl([
      trade({ side: 'buy', quantity: 10, fillPrice: 100, filledAt: '2026-01-01' }),
      trade({ side: 'sell', quantity: 2, fillPrice: 130, filledAt: '2026-01-02' }),
      trade({ side: 'sell', quantity: 2, fillPrice: 90, filledAt: '2026-01-03' }),
      trade({ side: 'sell', quantity: 2, fillPrice: 110, filledAt: '2026-01-04' }),
    ])
    const summary = summarize(rows, [])
    expect(summary.sells).toBe(3)
    expect(summary.winRatePct).toBeCloseTo(66.67, 1)
    expect(summary.grossProfit).toBe(80)
    expect(summary.grossLoss).toBe(20)
    expect(summary.profitFactor).toBe(4)
    expect(summary.largestWin).toBe(60)
    expect(summary.largestLoss).toBe(-20)
  })

  it('handles an account with no sells', () => {
    const summary = summarize(withRealizedPnl([trade({ side: 'buy', quantity: 1, fillPrice: 10, filledAt: '2026-01-01' })]), [])
    expect(summary.winRatePct).toBeNull()
    expect(summary.profitFactor).toBeNull()
  })
})

describe('maxDrawdownPct', () => {
  it('measures the largest fall from a running peak', () => {
    const points = [100, 120, 90, 130, 104].map((value, i) => ({ date: String(i), value }))
    expect(maxDrawdownPct(points)).toBeCloseTo(25)
  })
})

describe('csv', () => {
  it('quotes commas, quotes and newlines, and defuses formulas', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell(-12.5)).toBe('-12.5')
    expect(csvCell(null)).toBe('')
  })

  it('starts with a byte-order mark and ends rows with CRLF', () => {
    const csv = toCsv({ title: 't', headers: ['A', 'B'], rows: [[1, 'x']] })
    expect(csv.startsWith('﻿A,B\r\n1,x')).toBe(true)
  })
})

describe('htmlReport', () => {
  it('escapes everything it prints', () => {
    const html = htmlReport('<b>Title</b>', 'sub', [{ title: 'S', table: { title: 'T', headers: ['<h>'], rows: [['<script>']] } }], 'f')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;b&gt;Title&lt;/b&gt;')
  })
})
