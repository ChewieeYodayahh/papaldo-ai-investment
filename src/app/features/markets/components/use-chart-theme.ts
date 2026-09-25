'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { usePreferences } from '@/app/features/preferences/store'

/**
 * Chart colors, derived from the OKLCH tokens in globals.css.
 *
 * Two constraints meet here. The project's colour rule says every colour has
 * exactly one definition, as a token in `:root` / `.dark` — no hex literals in
 * components. But Lightweight Charts parses colour strings with its own
 * parser, which understands hex, rgb/rgba, hsl/hsla and named colours and
 * **rejects `oklch()`** with "Failed to parse color" at runtime.
 *
 * So the tokens stay the single source of truth and are converted here: the
 * browser resolves each token to pixels on a 1x1 canvas, and the RGB it gives
 * back is what the chart receives. Theme flips re-run the conversion, so dark
 * mode works without a second palette.
 */
export type ChartTheme = {
  line: string
  areaTop: string
  areaBottom: string
  up: string
  down: string
  text: string
  grid: string
  border: string
  transparent: string
}

type Rgb = { r: number; g: number; b: number; a: number }

const FALLBACK: Rgb = { r: 128, g: 128, b: 128, a: 1 }

/**
 * Resolve any CSS colour to RGB by painting one pixel and reading it back.
 *
 * Using the browser's own colour engine means this keeps working for whatever
 * the tokens become later — oklch today, something else tomorrow — without a
 * conversion library. The sentinel guards a browser too old for the token's
 * colour space, where assigning an unparseable value leaves fillStyle alone.
 */
function resolveColor(cssColor: string): Rgb {
  if (!cssColor) return FALLBACK

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return FALLBACK

  const sentinel = '#010203'
  context.fillStyle = sentinel
  context.fillStyle = cssColor
  if (context.fillStyle === sentinel && cssColor.trim() !== sentinel) return FALLBACK

  context.clearRect(0, 0, 1, 1)
  context.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
  return { r, g, b, a: a / 255 }
}

function readToken(name: string): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return resolveColor(raw)
}

function css({ r, g, b, a }: Rgb, alpha = a): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`
}

/**
 * Re-alpha a colour this hook already produced, for gradient stops that must
 * track whichever tone a caller picked at runtime. Takes the `rgb()` strings
 * from this module only -- it is not a general CSS colour parser.
 */
export function withAlpha(rgb: string, alpha: number): string {
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return rgb
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${Number(alpha.toFixed(3))})`
}

export function useChartTheme(): ChartTheme | null {
  const { resolvedTheme } = useTheme()
  const palette = usePreferences((s) => s.palette)
  const [theme, setTheme] = useState<ChartTheme | null>(null)

  useEffect(() => {
    // Children's effects run before the root layout's, so a new palette
    // attribute may not be on <html> yet. One frame later it is.
    const frame = requestAnimationFrame(() => {
      const line = readToken('--chart-2')
      const border = readToken('--border')

      setTheme({
        line: css(line),
        areaTop: css(line, 0.28),
        areaBottom: css(line, 0),
        up: css(readToken('--gain')),
        down: css(readToken('--loss')),
        text: css(readToken('--muted-foreground')),
        // The border token is already semi-transparent in dark mode, so fade
        // relative to whatever alpha it resolved to rather than assuming 1.
        grid: css(border, border.a * 0.6),
        border: css(border),
        transparent: 'rgba(0, 0, 0, 0)',
      })
    })
    return () => cancelAnimationFrame(frame)
    // resolvedTheme and palette are the triggers: the tokens change under
    // `.dark` and under `data-palette`.
  }, [resolvedTheme, palette])

  return theme
}
