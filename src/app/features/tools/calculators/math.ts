/**
 * Calculator maths (Carlos, 2026-09-29; formulas collected in the vault page
 * "investment-calculators"). Pure, so every function is unit tested.
 *
 *   replayHistory   what an amount would have become in a real price series:
 *                   a lump sum on the first month, then a contribution every
 *                   month after, each buying units at that month's close.
 *                   Nothing is assumed about returns; the series is the rate.
 *   projectFixed    the textbook compound-interest projection at a fixed
 *                   yearly rate, compounded monthly, deposits at month end.
 *   savingsGoal     the sinking-fund formula -- how much to put away each
 *                   period to reach a target:
 *                       PMT = (FV - P(1+i)^n) * i / ((1+i)^n - 1)
 *                   with i the periodic rate and n the number of periods.
 *
 * Amounts are plain numbers in whatever currency the caller works in.
 */

export type Frequency = 'weekly' | 'biweekly' | 'monthly'
export const PERIODS_PER_YEAR: Record<Frequency, number> = { weekly: 52, biweekly: 26, monthly: 12 }

export type MonthlyPoint = { date: string; close: number }

/** The last `years` of a monthly series (`years * 12` steps), or all of it. */
export function lastYears(points: MonthlyPoint[], years: number | 'max'): MonthlyPoint[] {
  if (years === 'max') return points
  const count = years * 12 + 1
  return points.length > count ? points.slice(-count) : points
}

/** Compound annual growth of a monthly series, in percent. Null with fewer than two points. */
export function seriesCagr(points: MonthlyPoint[]): number | null {
  if (points.length < 2) return null
  const first = points[0].close
  const last = points[points.length - 1].close
  if (!(first > 0) || !(last > 0)) return null
  return ((last / first) ** (12 / (points.length - 1)) - 1) * 100
}

export type ReplayRow = { date: string; contributed: number; value: number }
export type ReplayResult = {
  rows: ReplayRow[]
  finalValue: number
  contributed: number
  growth: number
  /** The asset's own CAGR over the same months, in percent. */
  cagrPct: number | null
  years: number
}

export function replayHistory(points: MonthlyPoint[], initial: number, monthly: number): ReplayResult | null {
  const valid = points.filter((p) => p.close > 0)
  if (valid.length < 2) return null

  let units = initial / valid[0].close
  let contributed = initial
  const rows: ReplayRow[] = [{ date: valid[0].date, contributed, value: initial }]

  for (let i = 1; i < valid.length; i++) {
    const price = valid[i].close
    if (monthly > 0) {
      units += monthly / price
      contributed += monthly
    }
    rows.push({ date: valid[i].date, contributed, value: units * price })
  }

  const finalValue = rows[rows.length - 1].value
  return {
    rows,
    finalValue,
    contributed,
    growth: finalValue - contributed,
    cagrPct: seriesCagr(valid),
    years: (valid.length - 1) / 12,
  }
}

export type YearRow = { year: number; contributed: number; growth: number; balance: number }

/** Fixed-rate projection, compounded monthly with deposits at the end of each month. */
export function projectFixed(initial: number, monthly: number, annualRatePct: number, years: number): YearRow[] {
  const i = annualRatePct / 100 / 12
  let balance = initial
  let contributed = initial
  const rows: YearRow[] = [{ year: 0, contributed, growth: 0, balance }]
  for (let month = 1; month <= years * 12; month++) {
    balance = balance * (1 + i) + monthly
    contributed += monthly
    if (month % 12 === 0) rows.push({ year: month / 12, contributed, growth: balance - contributed, balance })
  }
  return rows
}

export type SavingsGoalInput = {
  target: number
  years: number
  annualRatePct: number
  frequency: Frequency
  initial?: number
}

export type SavingsGoalResult = {
  /** Deposit needed every period. Zero when the starting amount already gets there. */
  payment: number
  periods: number
  totalContributions: number
  totalGrowth: number
  /** What the plan ends with: the target, or more if the starting amount overshoots. */
  finalBalance: number
  coveredByStart: boolean
  schedule: YearRow[]
}

export function savingsGoal({ target, years, annualRatePct, frequency, initial = 0 }: SavingsGoalInput): SavingsGoalResult {
  const perYear = PERIODS_PER_YEAR[frequency]
  const n = Math.max(1, Math.round(years * perYear))
  const i = annualRatePct / 100 / perYear
  const growthFactor = (1 + i) ** n
  const grownInitial = initial * growthFactor
  const remaining = Math.max(0, target - grownInitial)
  const payment = remaining === 0 ? 0 : i === 0 ? remaining / n : (remaining * i) / (growthFactor - 1)

  const schedule: YearRow[] = [{ year: 0, contributed: initial, growth: 0, balance: initial }]
  let balance = initial
  let contributed = initial
  for (let period = 1; period <= n; period++) {
    balance = balance * (1 + i) + payment
    contributed += payment
    if (period % perYear === 0 || period === n) {
      schedule.push({ year: Math.round((period / perYear) * 100) / 100, contributed, growth: balance - contributed, balance })
    }
  }

  return {
    payment,
    periods: n,
    totalContributions: contributed,
    totalGrowth: balance - contributed,
    finalBalance: balance,
    coveredByStart: remaining === 0,
    schedule,
  }
}

/** The yearly rate actually earned once compounding is counted: 5% monthly is 5.12%. */
export function effectiveAnnualRate(annualRatePct: number, periodsPerYear = 12): number {
  return ((1 + annualRatePct / 100 / periodsPerYear) ** periodsPerYear - 1) * 100
}

/** Years for money to double at a yearly rate. Null when it never does. */
export function doublingYears(annualRatePct: number): number | null {
  if (annualRatePct <= 0) return null
  return Math.log(2) / Math.log(1 + annualRatePct / 100)
}

export type DepositYear = { year: number; gross: number; net: number }

/**
 * A deposit left to renew for `years` (2026-09-30, Savings Planner). Each
 * term earns simple interest, principal x rate x months / 12, which is added
 * at maturity and renews with the principal -- how a time deposit rolls over.
 * `termMonths: 0` is a savings account, credited monthly. `gross` ignores the
 * tax; `net` has `taxRate` withheld from every credit, as banks do.
 */
export function depositGrowth(principal: number, annualRatePct: number, termMonths: number, years: number, taxRate: number): DepositYear[] {
  const step = Math.max(1, Math.round(termMonths))
  const perCredit = (annualRatePct / 100) * (step / 12)
  let gross = principal
  let net = principal
  const rows: DepositYear[] = [{ year: 0, gross, net }]
  for (let month = 1; month <= years * 12; month++) {
    if (month % step === 0) {
      gross += gross * perCredit
      net += net * perCredit * (1 - taxRate)
    }
    if (month % 12 === 0) rows.push({ year: month / 12, gross, net })
  }
  return rows
}

/** An ISO date (YYYY-MM-DD) `months` later, on the first of the month, in UTC. */
export function addMonths(iso: string, months: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString().slice(0, 10)
}

/**
 * Carries a replay forward `years` at a steady yearly rate -- the asset's own
 * CAGR (2026-09-30, the "Projected" line). Monthly compounding at the rate's
 * monthly equivalent, with the same top-up every month. The first row is the
 * last real month, so the projected line joins the historical one.
 */
export function projectFromCagr(last: ReplayRow, cagrPct: number, monthly: number, years: number): ReplayRow[] {
  const growth = (1 + cagrPct / 100) ** (1 / 12)
  const rows: ReplayRow[] = [last]
  let { value, contributed } = last
  for (let month = 1; month <= Math.round(years * 12); month++) {
    value = value * growth + monthly
    contributed += monthly
    rows.push({ date: addMonths(last.date, month), contributed, value })
  }
  return rows
}
