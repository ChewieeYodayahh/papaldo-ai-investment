import { describe, expect, it } from 'vitest'

import {
  doublingYears,
  effectiveAnnualRate,
  lastYears,
  projectFixed,
  replayHistory,
  savingsGoal,
  seriesCagr,
  type MonthlyPoint,
} from './math'

function series(values: number[]): MonthlyPoint[] {
  return values.map((close, i) => ({ date: `2020-${String((i % 12) + 1).padStart(2, '0')}-01`, close }))
}

describe('seriesCagr', () => {
  it('annualises the growth between the first and last month', () => {
    // 100 -> 121 over 24 months is 10% a year.
    const points = series(Array.from({ length: 25 }, (_, i) => 100 * 1.1 ** (i / 12)))
    expect(seriesCagr(points)).toBeCloseTo(10, 6)
  })

  it('is null without two usable points', () => {
    expect(seriesCagr(series([100]))).toBeNull()
    expect(seriesCagr(series([0, 100]))).toBeNull()
  })
})

describe('lastYears', () => {
  it('keeps years * 12 steps, or everything', () => {
    const points = series(Array.from({ length: 100 }, (_, i) => i + 1))
    expect(lastYears(points, 5)).toHaveLength(61)
    expect(lastYears(points, 'max')).toHaveLength(100)
    expect(lastYears(points, 20)).toHaveLength(100)
  })
})

describe('replayHistory', () => {
  it('grows a lump sum exactly as the price does', () => {
    const result = replayHistory(series([50, 60, 75, 100]), 1000, 0)!
    expect(result.finalValue).toBeCloseTo(2000)
    expect(result.contributed).toBe(1000)
    expect(result.growth).toBeCloseTo(1000)
  })

  it('buys units at each month’s price with the monthly contribution', () => {
    // 100 at 10 = 10 units; 100 at 20 = 5 more; worth 15 * 20 = 300.
    const result = replayHistory(series([10, 20]), 100, 100)!
    expect(result.contributed).toBe(200)
    expect(result.finalValue).toBeCloseTo(300)
    expect(result.rows).toHaveLength(2)
  })

  it('needs at least two prices', () => {
    expect(replayHistory(series([10]), 100, 0)).toBeNull()
  })
})

describe('projectFixed', () => {
  it('matches the textbook compound interest example', () => {
    // $5,000 at 5% compounded monthly for 5 years is $6,416.79 (TheCalculatorSite).
    const rows = projectFixed(5000, 0, 5, 5)
    expect(rows.at(-1)!.balance).toBeCloseTo(6416.79, 2)
    expect(rows).toHaveLength(6)
  })
})

describe('savingsGoal', () => {
  it('uses the sinking fund formula', () => {
    // 100,000 in 10 years at 6% monthly: PMT = FV * i / ((1+i)^n - 1).
    const i = 0.06 / 12
    const n = 120
    const expected = (100_000 * i) / ((1 + i) ** n - 1)
    const result = savingsGoal({ target: 100_000, years: 10, annualRatePct: 6, frequency: 'monthly' })
    expect(result.payment).toBeCloseTo(expected, 6)
    expect(result.finalBalance).toBeCloseTo(100_000, 4)
    expect(result.totalContributions + result.totalGrowth).toBeCloseTo(100_000, 4)
  })

  it('splits the goal evenly at a zero rate', () => {
    const result = savingsGoal({ target: 52_000, years: 1, annualRatePct: 0, frequency: 'weekly' })
    expect(result.payment).toBeCloseTo(1000)
    expect(result.totalGrowth).toBeCloseTo(0)
  })

  it('counts the starting amount and stops at zero when it is already enough', () => {
    const withStart = savingsGoal({ target: 100_000, years: 10, annualRatePct: 6, frequency: 'monthly', initial: 20_000 })
    const without = savingsGoal({ target: 100_000, years: 10, annualRatePct: 6, frequency: 'monthly' })
    expect(withStart.payment).toBeLessThan(without.payment)
    const covered = savingsGoal({ target: 1000, years: 10, annualRatePct: 6, frequency: 'monthly', initial: 1000 })
    expect(covered.payment).toBe(0)
    expect(covered.coveredByStart).toBe(true)
  })

  it('has one schedule row per year', () => {
    const result = savingsGoal({ target: 10_000, years: 3, annualRatePct: 4, frequency: 'biweekly' })
    expect(result.schedule.map((r) => r.year)).toEqual([0, 1, 2, 3])
  })
})

describe('rates', () => {
  it('computes the effective yearly rate and doubling time', () => {
    expect(effectiveAnnualRate(5)).toBeCloseTo(5.116, 3)
    expect(doublingYears(10)).toBeCloseTo(7.27, 2)
    expect(doublingYears(0)).toBeNull()
  })
})
