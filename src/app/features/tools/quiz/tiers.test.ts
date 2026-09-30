import { describe, expect, it } from 'vitest'

import { TIER_FOR_BAND, tierForBand } from './tiers'
import { RISK_BANDS } from './types'

describe('tierForBand', () => {
  it('maps each band to the asset tier of the same risk', () => {
    expect(tierForBand('Low')).toBe('conservative')
    expect(tierForBand('Medium')).toBe('moderate')
    expect(tierForBand('High')).toBe('aggressive')
  })

  it('covers every band with a distinct tier, never the band word itself', () => {
    const tiers = RISK_BANDS.map(tierForBand)
    expect(new Set(tiers).size).toBe(RISK_BANDS.length)
    for (const band of RISK_BANDS) expect(TIER_FOR_BAND[band]).not.toBe(band)
  })
})
