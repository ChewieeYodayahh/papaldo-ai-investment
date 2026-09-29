'use client'

import { useEffect } from 'react'

import { usePreferences } from '../store'

/**
 * Mounted once in the root layout. Mirrors palette and font onto <html>,
 * where globals.css picks them up. Loading saved preferences is
 * PreferencePersistence's job, since only a signed-in shell may load them.
 *
 * Forest and Figtree are the defaults, so their attributes are removed rather
 * than set -- the stylesheet's `:root` / `.dark` blocks are the forest palette.
 */
export function PreferencesEffects() {
  const palette = usePreferences((s) => s.palette)
  const font = usePreferences((s) => s.font)

  useEffect(() => {
    const root = document.documentElement
    if (palette === 'forest') root.removeAttribute('data-palette')
    else root.setAttribute('data-palette', palette)
  }, [palette])

  useEffect(() => {
    const root = document.documentElement
    if (font === 'figtree') root.removeAttribute('data-font')
    else root.setAttribute('data-font', font)
  }, [font])

  return null
}
