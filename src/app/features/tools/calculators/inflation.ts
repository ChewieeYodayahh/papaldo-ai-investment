/**
 * Purchasing-power maths (Carlos, 2026-09-30), over a yearly consumer price
 * index (World Bank FP.CPI.TOTL, `public.cpi_annual`). Pure and unit tested.
 *
 *   equivalent   what `amount` in one year is worth in another year's money:
 *                    amount x CPI(to) / CPI(from)
 *   buyingPower  what `amount` kept as cash buys over time, in the first
 *                year's money: amount x CPI(from) / CPI(year) -- the line
 *                that falls as prices rise.
 *   projection   the same fall carried forward at a steady yearly rate:
 *                    amount / (1 + i)^n
 */

export type CpiPoint = { year: number; cpi: number }

export function cpiAt(series: CpiPoint[], year: number): number | null {
  return series.find((point) => point.year === year)?.cpi ?? null
}

export function equivalent(amount: number, cpiFrom: number, cpiTo: number): number {
  return (amount * cpiTo) / cpiFrom
}

/** Average yearly inflation between two index levels, in percent. */
export function averageInflation(cpiFrom: number, cpiTo: number, years: number): number {
  if (years <= 0 || cpiFrom <= 0) return 0
  return ((cpiTo / cpiFrom) ** (1 / years) - 1) * 100
}

export type PowerPoint = { year: number; value: number }

/** What `amount` from `fromYear` buys in each later year, in `fromYear` money. */
export function buyingPower(amount: number, series: CpiPoint[], fromYear: number, toYear: number): PowerPoint[] {
  const base = cpiAt(series, fromYear)
  if (!base) return []
  return series
    .filter((point) => point.year >= fromYear && point.year <= toYear)
    .sort((a, b) => a.year - b.year)
    .map((point) => ({ year: point.year, value: (amount * base) / point.cpi }))
}

/** Carries a value forward `years` at a steady yearly inflation rate. The first point is `start`. */
export function projectBuyingPower(start: PowerPoint, inflationPct: number, years: number): PowerPoint[] {
  const points = [start]
  for (let n = 1; n <= years; n++) {
    points.push({ year: start.year + n, value: start.value / (1 + inflationPct / 100) ** n })
  }
  return points
}
