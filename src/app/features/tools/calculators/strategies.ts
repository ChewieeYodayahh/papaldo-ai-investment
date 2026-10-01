/**
 * Two "what if" tools (Carlos, 2026-09-30). Pure, so both are unit tested.
 *
 *   compareDcaLump   the same money invested two ways in a real price
 *                    series: a set amount every month (dollar-cost
 *                    averaging) or all of it on the first month.
 *   dcaWinRate       over every window of that length in the history, how
 *                    often the lump sum ended ahead.
 *   costOfWaiting    retirement savings if you start now versus 5, 10 or 15
 *                    years later, at a steady yearly return.
 */

import type { MonthlyPoint } from './math'

export type DcaRow = { date: string; dca: number; lump: number; invested: number }
export type DcaResult = {
  rows: DcaRow[]
  total: number
  dcaFinal: number
  lumpFinal: number
  /** Average price paid per unit by monthly buying, and by the lump sum. */
  dcaAvgPrice: number
  lumpPrice: number
}

/**
 * `monthly` is invested at every month's close; the lump sum is the same
 * total (monthly x months) invested at the first close. `invested` tracks the
 * money the monthly investor has put in so far.
 */
export function compareDcaLump(points: MonthlyPoint[], monthly: number): DcaResult | null {
  const valid = points.filter((p) => p.close > 0)
  if (valid.length < 2 || !(monthly > 0)) return null
  const total = monthly * valid.length
  const lumpUnits = total / valid[0].close
  let dcaUnits = 0
  const rows = valid.map((point, i) => {
    dcaUnits += monthly / point.close
    return { date: point.date, dca: dcaUnits * point.close, lump: lumpUnits * point.close, invested: monthly * (i + 1) }
  })
  const last = rows[rows.length - 1]
  return { rows, total, dcaFinal: last.dca, lumpFinal: last.lump, dcaAvgPrice: total / dcaUnits, lumpPrice: valid[0].close }
}

/** Over every `months`-long window in the series, how many times the lump sum finished ahead. */
export function dcaWinRate(points: MonthlyPoint[], months: number): { lumpWins: number; windows: number } {
  const valid = points.filter((p) => p.close > 0)
  let lumpWins = 0
  let windows = 0
  for (let start = 0; start + months <= valid.length; start++) {
    const result = compareDcaLump(valid.slice(start, start + months), 1)
    if (!result) continue
    windows += 1
    if (result.lumpFinal > result.dcaFinal) lumpWins += 1
  }
  return { lumpWins, windows }
}

/**
 * The 4% rule (Carlos, 2026-10-01): enough saved to spend about 4% a year,
 * which is 25 years of spending.
 */
export const NEST_EGG_YEARS = 25

/**
 * The monthly deposit that grows to `target` in `months`, compounded monthly
 * at `ratePct` a year with deposits at month end. Null when no months are left.
 */
export function monthlySavingNeeded(target: number, months: number, ratePct: number): number | null {
  if (months <= 0) return null
  const i = ratePct / 100 / 12
  if (i === 0) return target / months
  return (target * i) / ((1 + i) ** months - 1)
}

export type RetirementStart = {
  delay: number
  startAge: number
  /** Saving needed each month from `startAge` to retirement; null when the wait reaches retirement. */
  monthly: number | null
  /** Everything put in over those months. */
  contributed: number | null
}

export type RetirementPlan = {
  /** The monthly income wanted, grown by inflation from today's money to retirement. */
  incomeAtRetirement: number
  /** What to have saved by retirement: 25 years of that income (the 4% rule). */
  target: number
  starts: RetirementStart[]
}

/**
 * The cost of waiting, as Carlos framed it (2026-10-01): not what you would
 * end up with, but what you must save each month to retire on the income
 * you want -- starting now, or `delays` years from now. The later the start,
 * the more each month has to carry.
 */
export function retirementPlan({
  age,
  retireAge,
  monthlyIncome,
  ratePct,
  inflationPct,
  delays,
}: {
  age: number
  retireAge: number
  /** In today's money. */
  monthlyIncome: number
  ratePct: number
  inflationPct: number
  delays: number[]
}): RetirementPlan {
  const years = Math.max(0, retireAge - age)
  const incomeAtRetirement = monthlyIncome * (1 + inflationPct / 100) ** years
  const target = incomeAtRetirement * 12 * NEST_EGG_YEARS
  const starts = delays.map((delay) => {
    const startAge = age + delay
    const months = (retireAge - startAge) * 12
    const monthly = monthlySavingNeeded(target, months, ratePct)
    return { delay, startAge, monthly, contributed: monthly === null ? null : monthly * months }
  })
  return { incomeAtRetirement, target, starts }
}
