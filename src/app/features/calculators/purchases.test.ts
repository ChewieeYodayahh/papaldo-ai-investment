import { describe, expect, it } from 'vitest'

import { describePurchase, PURCHASES, REFERENCE_PHP_PER_USD, whatItBuys } from './purchases'

const item = (id: string) => PURCHASES.find((p) => p.id === id)!

describe('whatItBuys', () => {
  it('leads with the priciest things the amount covers', () => {
    // 8M pesos at 58: one Porsche (~7.3M), one house, eight colleges, nine cars.
    const result = whatItBuys(8_000_000 / REFERENCE_PHP_PER_USD, REFERENCE_PHP_PER_USD)
    expect(result.map((p) => p.item.id)).toEqual(['porsche', 'house', 'college', 'car'])
    expect(result[0].count).toBe(1)
  })

  it('falls back to small things for small amounts', () => {
    const result = whatItBuys(60_000 / 58, 58)
    expect(result.map((p) => p.item.id)).toEqual(['ps5', 'japan', 'chickenjoy'])
    expect(result.at(-1)!.count).toBe(Math.floor(60_000 / 109))
  })

  it('returns nothing for zero or negative amounts', () => {
    expect(whatItBuys(0, 58)).toEqual([])
    expect(whatItBuys(-5, 58)).toEqual([])
  })

  it('uses the reference rate when the live one is missing', () => {
    expect(whatItBuys(10_000, null)).toEqual(whatItBuys(10_000, REFERENCE_PHP_PER_USD))
  })
})

describe('describePurchase', () => {
  it('reads naturally', () => {
    expect(describePurchase(item('iphone'), 666)).toBe('666 iPhone 17 Pro Max')
    expect(describePurchase(item('porsche'), 2)).toBe('2 Porsche 911s')
    expect(describePurchase(item('house'), 1)).toBe('1 house and lot')
    expect(describePurchase(item('college'), 3)).toBe('College for 3 kids')
    expect(describePurchase(item('college'), 1)).toBe('College for 1 kid')
  })
})
