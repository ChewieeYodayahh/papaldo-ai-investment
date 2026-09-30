import { describe, expect, it } from 'vitest'

import { hexToRgb, hsvToRgb, isHex, luminance, normalizeHex, readableOn, rgbToHex, rgbToHsv } from './colors'

describe('hex', () => {
  it('normalises short and long forms, with or without #', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc')
    expect(normalizeHex('#9BE15D')).toBe('#9be15d')
    expect(normalizeHex('#12345')).toBeNull()
    expect(isHex('zzzzzz')).toBe(false)
  })

  it('round-trips through RGB', () => {
    expect(hexToRgb('#9be15d')).toEqual({ r: 155, g: 225, b: 93 })
    expect(rgbToHex({ r: 155, g: 225, b: 93 })).toBe('#9be15d')
  })
})

describe('HSV', () => {
  it('matches the primaries and greys', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 1, v: 1 })
    expect(rgbToHsv({ r: 0, g: 0, b: 255 }).h).toBe(240)
    expect(rgbToHsv({ r: 128, g: 128, b: 128 }).s).toBe(0)
  })

  it('round-trips any colour', () => {
    for (const hex of ['#9be15d', '#5fb3b3', '#141414', '#ffffff', '#c026d3']) {
      expect(rgbToHex(hsvToRgb(rgbToHsv(hexToRgb(hex))))).toBe(hex)
    }
  })
})

describe('readableOn', () => {
  it('puts dark text on light colours and light text on dark ones', () => {
    expect(readableOn('#ffffff')).toBe('#141414')
    expect(readableOn('#9be15d')).toBe('#141414')
    expect(readableOn('#1e3a8a')).toBe('#fafafa')
    expect(luminance('#000000')).toBe(0)
  })
})
