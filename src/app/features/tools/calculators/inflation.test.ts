import { describe, expect, it } from 'vitest'

import { averageInflation, buyingPower, cpiAt, equivalent, projectBuyingPower, type CpiPoint } from './inflation'

// Prices double every ten years: 2000 = 50, 2010 = 100, 2020 = 200.
const SERIES: CpiPoint[] = [
  { year: 2020, cpi: 200 },
  { year: 2000, cpi: 50 },
  { year: 2010, cpi: 100 },
]

describe('equivalent', () => {
  it('scales an amount by the ratio of the two years’ index levels', () => {
    expect(equivalent(1_000, 50, 200)).toBe(4_000)
    expect(equivalent(1_000, 200, 50)).toBe(250)
  })
})

describe('averageInflation', () => {
  it('annualises the rise between two years', () => {
    // Doubling over ten years is about 7.18% a year.
    expect(averageInflation(100, 200, 10)).toBeCloseTo((2 ** 0.1 - 1) * 100, 9)
    expect(averageInflation(100, 200, 0)).toBe(0)
  })
})

describe('buyingPower', () => {
  it('falls as prices rise, in the first year’s money, whatever order the series is in', () => {
    expect(buyingPower(1_000, SERIES, 2000, 2020)).toEqual([
      { year: 2000, value: 1_000 },
      { year: 2010, value: 500 },
      { year: 2020, value: 250 },
    ])
  })

  it('is empty for a year the index does not have', () => {
    expect(buyingPower(1_000, SERIES, 1999, 2020)).toEqual([])
    expect(cpiAt(SERIES, 1999)).toBeNull()
  })
})

describe('projectBuyingPower', () => {
  it('keeps falling at the chosen rate from the last real year', () => {
    const points = projectBuyingPower({ year: 2020, value: 1_000 }, 10, 2)
    expect(points.map((p) => p.year)).toEqual([2020, 2021, 2022])
    expect(points[2].value).toBeCloseTo(1_000 / 1.21, 9)
  })
})
