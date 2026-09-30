'use client'

import { useEffect } from 'react'

import { normalizeHex, readableOn } from '../colors'
import { usePreferences } from '../store'

/** Tokens a custom theme sets (2026-09-30), from its primary and secondary colours. */
const CUSTOM_TOKENS = [
  '--primary',
  '--primary-foreground',
  '--ring',
  '--highlight',
  '--chart-1',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-ring',
  '--secondary',
  '--secondary-foreground',
  '--chart-2',
] as const

/**
 * Mounted once in the root layout. Mirrors palette and font onto <html>,
 * where globals.css picks them up. Loading saved preferences is
 * PreferencePersistence's job, since only a signed-in shell may load them.
 *
 * Forest has no attribute (the stylesheet's `:root` / `.dark` blocks are
 * forest); every other palette sets `data-palette`. A custom theme rides on
 * midnight's neutrals and sets its two colours as inline variables, which
 * outrank the stylesheet in light and dark alike.
 */
export function PreferencesEffects() {
  const palette = usePreferences((s) => s.palette)
  const custom = usePreferences((s) => s.customColors)
  const font = usePreferences((s) => s.font)

  useEffect(() => {
    const root = document.documentElement
    if (palette === 'forest') root.removeAttribute('data-palette')
    else root.setAttribute('data-palette', palette === 'custom' ? 'midnight' : palette)

    for (const token of CUSTOM_TOKENS) root.style.removeProperty(token)
    if (palette !== 'custom') return
    const primary = normalizeHex(custom.primary)
    const secondary = normalizeHex(custom.secondary)
    if (primary) {
      const on = readableOn(primary)
      for (const token of ['--primary', '--ring', '--highlight', '--chart-1', '--sidebar-primary', '--sidebar-ring']) root.style.setProperty(token, primary)
      root.style.setProperty('--primary-foreground', on)
      root.style.setProperty('--sidebar-primary-foreground', on)
    }
    if (secondary) {
      root.style.setProperty('--secondary', secondary)
      root.style.setProperty('--secondary-foreground', readableOn(secondary))
      root.style.setProperty('--chart-2', secondary)
    }
  }, [palette, custom])

  useEffect(() => {
    const root = document.documentElement
    if (font === 'figtree') root.removeAttribute('data-font')
    else root.setAttribute('data-font', font)
  }, [font])

  return null
}
