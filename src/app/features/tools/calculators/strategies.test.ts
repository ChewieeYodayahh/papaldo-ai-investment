import { describe, expect, it } from 'vitest'

import type { MonthlyPoint } from './math'
import { compareDcaLump, dcaWinRate, monthlySavingNeeded, NEST_EGG_YEARS, retirementPlan } from './strategies'

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

describe('monthlySavingNeeded', () => {
  it('splits the target evenly with no growth', () => {
    expect(monthlySavingNeeded(12_000, 120, 0)).toBe(100)
  })

  it('is the deposit whose month-end compounding reaches the target', () => {
    const monthly = monthlySavingNeeded(50_000, 240, 6)!
    const i = 0.06 / 12
    expect(monthly * (((1 + i) ** 240 - 1) / i)).toBeCloseTo(50_000, 6)
  })

  it('has no answer once no months are left', () => {
    expect(monthlySavingNeeded(1_000, 0, 7)).toBeNull()
  })
})

describe('retirementPlan', () => {
  it('targets 25 years of the income, grown by inflation', () => {
    const flat = retirementPlan({ age: 30, retireAge: 60, monthlyIncome: 1_000, ratePct: 7, inflationPct: 0, delays: [0] })
    expect(flat.target).toBe(1_000 * 12 * NEST_EGG_YEARS)
    const inflated = retirementPlan({ age: 30, retireAge: 60, monthlyIncome: 1_000, ratePct: 7, inflationPct: 4, delays: [0] })
    expect(inflated.incomeAtRetirement).toBeCloseTo(1_000 * 1.04 ** 30, 6)
  })

  it('asks more of every month the later you start', () => {
    const { starts } = retirementPlan({ age: 22, retireAge: 60, monthlyIncome: 1_000, ratePct: 7, inflationPct: 0, delays: [0, 5, 10, 15] })
    const monthly = starts.map((start) => start.monthly!)
    expect(monthly[1]).toBeGreaterThan(monthly[0])
    expect(monthly[3]).toBeGreaterThan(monthly[2])
    // Starting at 32 instead of 22, at 7% compounded monthly, takes about 2.2 times as much each month.
    expect(monthly[2] / monthly[0]).toBeCloseTo(2.18, 2)
    expect(starts[2].startAge).toBe(32)
  })

  it('has no monthly figure when the wait reaches retirement', () => {
    const { starts } = retirementPlan({ age: 55, retireAge: 60, monthlyIncome: 1_000, ratePct: 7, inflationPct: 3, delays: [5] })
    expect(starts[0].monthly).toBeNull()
    expect(starts[0].contributed).toBeNull()
  })
})
