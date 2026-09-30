/**
 * The 50/30/20 budget (Carlos, 2026-09-30; the vault page
 * "budgeting-50-30-20"): take-home pay split into needs (50%), wants (30%)
 * and savings or debt repayment (20%). Pure, so the split is unit tested.
 */

export type Bucket = 'needs' | 'wants' | 'savings'
export const BUCKETS: Bucket[] = ['needs', 'wants', 'savings']
export const TARGET_SHARE: Record<Bucket, number> = { needs: 0.5, wants: 0.3, savings: 0.2 }

export type BudgetLine = { id: string; label: string; bucket: Bucket; amount: number }

export type BudgetRegion = 'PH' | 'INTL'

/** Starting lines for each context; amounts start empty for the person to fill in. */
export const PRESETS: Record<BudgetRegion, Array<Omit<BudgetLine, 'id' | 'amount'>>> = {
  PH: [
    { label: 'Rent or amortisation', bucket: 'needs' },
    { label: 'Meralco (electricity)', bucket: 'needs' },
    { label: 'Water', bucket: 'needs' },
    { label: 'Load / data', bucket: 'needs' },
    { label: 'Commute (jeep, MRT, Grab)', bucket: 'needs' },
    { label: 'Groceries & palengke', bucket: 'needs' },
    { label: 'Tuition', bucket: 'needs' },
    { label: 'Padala to family', bucket: 'needs' },
    { label: 'Eating out & milk tea', bucket: 'wants' },
    { label: 'Streaming & subscriptions', bucket: 'wants' },
    { label: 'Emergency fund', bucket: 'savings' },
    { label: 'Investing', bucket: 'savings' },
  ],
  INTL: [
    { label: 'Rent or mortgage', bucket: 'needs' },
    { label: 'Utilities', bucket: 'needs' },
    { label: 'Phone & internet', bucket: 'needs' },
    { label: 'Transit or car', bucket: 'needs' },
    { label: 'Groceries', bucket: 'needs' },
    { label: 'Insurance', bucket: 'needs' },
    { label: 'Dining out', bucket: 'wants' },
    { label: 'Subscriptions & hobbies', bucket: 'wants' },
    { label: 'Emergency fund', bucket: 'savings' },
    { label: 'Retirement & investing', bucket: 'savings' },
  ],
}

export type BucketResult = {
  bucket: Bucket
  target: number
  actual: number
  /** Share of take-home pay actually going here, in percent. */
  sharePct: number
  /** Positive when spending is over the target (for savings, when it is under). */
  gap: number
}

export type BudgetResult = {
  buckets: BucketResult[]
  allocated: number
  /** Pay not yet given a job. Negative when the lines add up to more than the pay. */
  unallocated: number
}

export function splitBudget(pay: number, lines: BudgetLine[]): BudgetResult {
  const safePay = Math.max(0, pay)
  const buckets = BUCKETS.map((bucket): BucketResult => {
    const target = safePay * TARGET_SHARE[bucket]
    const actual = lines.filter((line) => line.bucket === bucket).reduce((sum, line) => sum + Math.max(0, line.amount), 0)
    return {
      bucket,
      target,
      actual,
      sharePct: safePay > 0 ? (actual / safePay) * 100 : 0,
      gap: bucket === 'savings' ? target - actual : actual - target,
    }
  })
  const allocated = buckets.reduce((sum, b) => sum + b.actual, 0)
  return { buckets, allocated, unallocated: safePay - allocated }
}

/** One or two plain-language tips for the biggest problems, most urgent first. */
export function budgetTips(result: BudgetResult, pay: number): string[] {
  if (pay <= 0) return ['Enter your take-home pay (after tax and contributions) to see the split.']
  const tips: string[] = []
  const byBucket = Object.fromEntries(result.buckets.map((b) => [b.bucket, b])) as Record<Bucket, BucketResult>
  if (result.unallocated < 0) tips.push('Your lines add up to more than you take home. Trim wants first, then look at the biggest needs.')
  if (byBucket.needs.gap > 0) {
    tips.push('Needs are over half your pay. Housing and transport are usually the big levers; a cheaper plan or a shared ride adds up.')
  }
  if (byBucket.wants.gap > 0) tips.push('Wants are over 30%. Pick one or two to pause for a month and move that money to savings.')
  if (byBucket.savings.gap > 0 && result.unallocated > 0) {
    tips.push('Give the unallocated money a job: topping up savings gets you to the 20% target.')
  } else if (byBucket.savings.gap > 0) {
    tips.push('Savings are under 20%. Start with an emergency fund of three to six months of needs, then invest.')
  }
  if (tips.length === 0) tips.push('Right on the 50/30/20 split. Automate the savings transfer on payday so it stays that way.')
  return tips.slice(0, 2)
}
