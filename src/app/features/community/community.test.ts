import { describe, expect, it, vi } from 'vitest'

import { allocation, SLICES } from './allocation'

vi.mock('server-only', () => ({}))

const { isFriendAction, normalizeUsername, toRelation } = await import('./api/friends')

describe('normalizeUsername', () => {
  it('trims and accepts the 3-30 characters a username can have', () => {
    expect(normalizeUsername('  david ')).toBe('david')
    expect(normalizeUsername('abc')).toBe('abc')
    expect(normalizeUsername('x'.repeat(30))).toBe('x'.repeat(30))
  })

  it('refuses anything that cannot be a username', () => {
    expect(normalizeUsername('ab')).toBeNull()
    expect(normalizeUsername('x'.repeat(31))).toBeNull()
    expect(normalizeUsername('   ')).toBeNull()
    expect(normalizeUsername(42)).toBeNull()
    expect(normalizeUsername(undefined)).toBeNull()
  })
})

describe('friend action and relation parsing', () => {
  it('knows the four actions and nothing else', () => {
    for (const action of ['request', 'accept', 'decline', 'remove']) expect(isFriendAction(action)).toBe(true)
    expect(isFriendAction('accepted')).toBe(false)
    expect(isFriendAction(null)).toBe(false)
  })

  it('falls back to "none" for anything the database did not promise', () => {
    expect(toRelation('friends')).toBe('friends')
    expect(toRelation('incoming')).toBe('incoming')
    expect(toRelation('admin')).toBe('none')
    expect(toRelation(undefined)).toBe('none')
  })
})

describe('allocation', () => {
  it('gives each holding and the cash its share of the total, largest first', () => {
    const slices = allocation(
      [
        { symbol: 'MSFT', value: 250 },
        { symbol: 'AAPL', value: 500 },
      ],
      250,
      1000,
    )
    expect(slices.map((s) => [s.label, s.percent])).toEqual([
      ['AAPL', 50],
      ['MSFT', 25],
      ['Cash', 25],
    ])
    expect(slices.reduce((sum, s) => sum + s.percent, 0)).toBeCloseTo(100)
  })

  it(`folds everything after the top ${SLICES} into "Other"`, () => {
    const holdings = Array.from({ length: SLICES + 2 }, (_, i) => ({ symbol: `S${i}`, value: 100 }))
    const slices = allocation(holdings, 0, 100 * holdings.length)
    expect(slices).toHaveLength(SLICES + 1)
    expect(slices.at(-1)).toMatchObject({ key: 'soc.other' })
    expect(slices.at(-1)?.percent).toBeCloseTo((200 / 700) * 100)
  })

  it('leaves out holdings without a live price, and draws nothing for an empty account', () => {
    expect(allocation([{ symbol: 'X', value: null }], 100, 100).map((s) => s.label)).toEqual(['Cash'])
    expect(allocation([], 0, 0)).toEqual([])
  })
})
