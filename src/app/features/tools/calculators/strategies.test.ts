import { describe, expect, it } from 'vitest'

import type { MonthlyPoint } from './math'
import { compareDcaLump, costOfWaiting, dcaWinRate } from './strategies'

const series = (closes: number[]): MonthlyPoint[] => closes.map((close, i) => ({ date: `2020-${String(i + 1).padStart(2, '0')}-01`, close }))

describe('compareDcaLump', () => {
  it('invests the same total both ways', () => {
    const result = compareDcaLump(series([10, 20, 40]), 100)!
    expect(result.total).toBe(300)
    // Lump: 30 units at 10 -> 1,200. DCA: 10 + 5 + 2.5 units -> 17.5 x 40 = 700.
    expect(result.lumpFinal).toBe(1_200)
    expect(result.dcaFinal).toBe(700)
    expect(result.rows.map((r) => r.invested)).toEqual([100, 200, 300])
  })

  it('shows DCA buying cheaper on the way down', () => {
    const result = compareDcaLump(series([40, 20, 10]), 100)!
    expect(result.dcaFinal).toBeGreaterThan(result.lumpFinal)
    // Harmonic mean of the prices: 300 / (2.5 + 5 + 10) units.
    expect(result.dcaAvgPrice).toBeCloseTo(300 / 17.5, 9)
  })

  it('needs two prices and a positive amount', () => {
    expect(compareDcaLump(series([10]), 100)).toBeNull()
    expect(compareDcaLump(series([10, 20]), 0)).toBeNull()
  })
})

describe('dcaWinRate', () => {
  it('counts every window of the length', () => {
    // Rising prices: the lump sum wins every 2-month window.
    expect(dcaWinRate(series([1, 2, 3, 4]), 2)).toEqual({ lumpWins: 3, windows: 3 })
    expect(dcaWinRate(series([4, 3, 2, 1]), 2)).toEqual({ lumpWins: 0, windows: 3 })
  })
})

describe('costOfWaiting', () => {
  it('grows each start to retirement, and a later start ends with less', () => {
    const [now, later] = costOfWaiting(25, 65, 100, 0, [0, 10])
    expect(now.final).toBe(100 * 12 * 40)
    expect(later.final).toBe(100 * 12 * 30)
    expect(later.startAge).toBe(35)
    expect(now.byAge).toHaveLength(41)
    expect(later.byAge[10].balance).toBe(0)
  })

  it('compounds monthly at the yearly rate', () => {
    const [scenario] = costOfWaiting(30, 31, 100, 12, [0])
    // 12 month-end deposits at 1% a month: 100 x ((1.01^12 - 1) / 0.01).
    expect(scenario.final).toBeCloseTo(100 * ((1.01 ** 12 - 1) / 0.01), 6)
    expect(scenario.contributed).toBe(1_200)
  })

  it('saves nothing when the wait reaches retirement', () => {
    const [scenario] = costOfWaiting(60, 65, 100, 7, [5])
    expect(scenario.final).toBe(0)
  })
})
