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

export type WaitScenario = {
  delay: number
  startAge: number
  /** Balance at each age from the current age to retirement (0 before starting). */
  byAge: Array<{ age: number; balance: number }>
  final: number
  contributed: number
}

/**
 * Saves `monthly` from `age + delay` to `retireAge`, compounded monthly at
 * `ratePct` a year with deposits at month end. A delay that reaches
 * retirement saves nothing.
 */
export function costOfWaiting(age: number, retireAge: number, monthly: number, ratePct: number, delays: number[]): WaitScenario[] {
  const i = ratePct / 100 / 12
  return delays.map((delay) => {
    const startAge = age + delay
    let balance = 0
    let contributed = 0
    const byAge = [{ age, balance: 0 }]
    for (let year = age; year < retireAge; year++) {
      for (let month = 0; month < 12; month++) {
        balance *= 1 + i
        if (year >= startAge) {
          balance += monthly
          contributed += monthly
        }
      }
      byAge.push({ age: year + 1, balance })
    }
    return { delay, startAge, byAge, final: balance, contributed }
  })
}
