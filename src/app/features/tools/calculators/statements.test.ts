import { describe, expect, it } from 'vitest'

import { DRAFT_TTL_MS, emptyStatements, parseDraft, sampleStatements, serializeDraft, statementRows, totals } from './statements'

describe('totals', () => {
  it('ties all three statements on the sample', () => {
    const t = totals(sampleStatements())
    expect(t.netIncome).toBe(61_000)
    expect(t.retainedEarnings).toBe(71_000) // 40k opening + 61k - 30k drawn
    expect(t.equity).toBe(171_000)
    expect(t.assets).toBe(241_000)
    expect(t.liabilities + t.equity).toBe(241_000)
    expect(t.operating).toBe(69_000)
    expect(t.netChange).toBe(60_000)
    expect(t.closingCash).toBe(100_000)
    expect(t.balances).toBe(true)
    expect(t.cashTies).toBe(true)
  })

  it('reports how far off each check is', () => {
    const s = sampleStatements()
    s.cash = 99_000
    const t = totals(s)
    expect(t.balanceGap).toBe(-1_000)
    expect(t.cashGap).toBe(1_000)
    expect(t.balances).toBe(false)
    expect(t.cashTies).toBe(false)
  })

  it('lets net income flow into retained earnings', () => {
    const s = sampleStatements()
    s.revenue[0].amount += 10_000
    expect(totals(s).retainedEarnings).toBe(81_000)
  })

  it('treats an empty template as balanced at zero', () => {
    const t = totals(emptyStatements())
    expect([t.balances, t.cashTies, t.netIncome]).toEqual([true, true, 0])
  })
})

describe('drafts', () => {
  const now = Date.UTC(2026, 8, 30)

  it('round-trips a draft edited within five days', () => {
    const data = sampleStatements()
    const parsed = parseDraft(serializeDraft(data, now - DRAFT_TTL_MS + 1), now)
    expect(parsed && 'data' in parsed ? parsed.data.company : null).toBe(data.company)
  })

  it('expires after five days without an edit', () => {
    expect(parseDraft(serializeDraft(sampleStatements(), now - DRAFT_TTL_MS - 1), now)).toEqual({ expired: true })
  })

  it('ignores missing or damaged drafts', () => {
    expect(parseDraft(null, now)).toBeNull()
    expect(parseDraft('{not json', now)).toBeNull()
    expect(parseDraft(JSON.stringify({ version: 2, lastEditedAt: now, data: {} }), now)).toBeNull()
  })
})

describe('statementRows', () => {
  it('lists every line with the totals, ending on closing cash', () => {
    const rows = statementRows(sampleStatements())
    expect(rows[0]).toEqual(['Income statement', 'Revenue', 'Sales', 480_000])
    expect(rows.find((r) => r[2] === 'Net income')?.[3]).toBe(61_000)
    expect(rows.at(-1)).toEqual(['Cash flow', 'Cash', 'Closing cash', 100_000])
  })
})
