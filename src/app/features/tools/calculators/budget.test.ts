import { describe, expect, it } from 'vitest'

import { budgetTips, splitBudget, type BudgetLine } from './budget'

const line = (bucket: BudgetLine['bucket'], amount: number): BudgetLine => ({ id: `${bucket}-${amount}`, label: bucket, bucket, amount })

describe('splitBudget', () => {
  it('sets 50/30/20 targets and adds up each bucket', () => {
    const result = splitBudget(40_000, [line('needs', 15_000), line('needs', 5_000), line('wants', 12_000), line('savings', 8_000)])
    expect(result.buckets.map((b) => [b.bucket, b.target, b.actual, b.sharePct])).toEqual([
      ['needs', 20_000, 20_000, 50],
      ['wants', 12_000, 12_000, 30],
      ['savings', 8_000, 8_000, 20],
    ])
    expect(result.unallocated).toBe(0)
  })

  it('reports overspending as a positive gap, and undersaving too', () => {
    const result = splitBudget(10_000, [line('needs', 7_000), line('savings', 500)])
    const [needs, wants, savings] = result.buckets
    expect(needs.gap).toBe(2_000)
    expect(wants.gap).toBe(-3_000)
    expect(savings.gap).toBe(1_500)
    expect(result.unallocated).toBe(2_500)
  })

  it('ignores negative amounts and a negative pay', () => {
    const result = splitBudget(-5, [line('wants', -100)])
    expect(result.buckets.every((b) => b.target === 0 && b.actual === 0 && b.sharePct === 0)).toBe(true)
  })
})

describe('budgetTips', () => {
  it('asks for pay first', () => {
    expect(budgetTips(splitBudget(0, []), 0)[0]).toMatch(/take-home pay/)
  })

  it('leads with overspending, and gives at most two tips', () => {
    const tips = budgetTips(splitBudget(10_000, [line('needs', 8_000), line('wants', 4_000)]), 10_000)
    expect(tips).toHaveLength(2)
    expect(tips[0]).toMatch(/more than you take home/)
  })

  it('says so when the split is right', () => {
    const tips = budgetTips(splitBudget(100, [line('needs', 50), line('wants', 30), line('savings', 20)]), 100)
    expect(tips).toEqual([expect.stringMatching(/Right on the 50\/30\/20 split/)])
  })
})
