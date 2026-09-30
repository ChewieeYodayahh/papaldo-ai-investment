/**
 * Colour maths for the custom theme's picker (Carlos, 2026-09-30): hex, RGB
 * and HSV (the picker's square is saturation x value, its slider hue), plus
 * a readable text colour for any background. Pure, so it is unit tested.
 */

export type Rgb = { r: number; g: number; b: number }
export type Hsv = { h: number; s: number; v: number }

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i

export function isHex(value: string): boolean {
  return HEX.test(value.trim())
}

/** `#abc` and `abc` are accepted; always returns `#aabbcc` lowercase. */
export function normalizeHex(value: string): string | null {
  const match = HEX.exec(value.trim())
  if (!match) return null
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join('') : match[1]
  return `#${digits.toLowerCase()}`
}

export function hexToRgb(hex: string): Rgb {
  const clean = normalizeHex(hex) ?? '#000000'
  const n = Number.parseInt(clean.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`
}

/** h in [0, 360), s and v in [0, 1]. */
export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Near-black or near-white, whichever reads better on `hex`. */
export function readableOn(hex: string): string {
  const l = luminance(hex)
  // Contrast against white vs against black; pick the larger.
  return (1.05 / (l + 0.05) >= (l + 0.05) / 0.05) ? '#fafafa' : '#141414'
}
