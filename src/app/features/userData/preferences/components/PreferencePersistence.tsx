'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

import { DEFAULT_PREFERENCES, PREFERENCES_KEY, THEMES, setPreferencePersistence, usePreferences, type ThemeMode } from '../store'

/** Marks that this tab's guest visit has already started from the defaults. */
const GUEST_VISIT_KEY = 'papaldo-guest-visit'

function isThemeMode(value: string | undefined): value is ThemeMode {
  return (THEMES as readonly string[]).includes(value ?? '')
}

/**
 * Rendered by both shells, told whether someone is signed in.
 *
 * Signed in: loads the saved preferences, applies the saved light/dark mode
 * and keeps saving every change. Signed out: nothing is saved, and each new
 * guest visit (a new tab session) starts from the defaults, mode included.
 * A signed-in user's settings come back when they sign in again.
 */
export function PreferencePersistence({ signedIn }: { signedIn: boolean }) {
  const { theme, setTheme } = useTheme()
  const setSavedTheme = usePreferences((s) => s.setTheme)
  const ready = useRef(false)

  useEffect(() => {
    let cancelled = false
    ready.current = false

    let hadSaved = false
    try {
      hadSaved = signedIn && localStorage.getItem(PREFERENCES_KEY) !== null
    } catch {
      hadSaved = false
    }

    void setPreferencePersistence(signedIn).then(() => {
      if (cancelled) return
      if (signedIn) {
        // First visit since preferences started being account-scoped: keep
        // whatever mode the browser already shows instead of forcing dark.
        if (hadSaved) setTheme(usePreferences.getState().theme)
      } else {
        try {
          if (!sessionStorage.getItem(GUEST_VISIT_KEY)) {
            sessionStorage.setItem(GUEST_VISIT_KEY, '1')
            setTheme(DEFAULT_PREFERENCES.theme)
          }
        } catch {
          // Storage blocked: the visit simply keeps next-themes' own default.
        }
      }
      ready.current = true
    })

    return () => {
      cancelled = true
    }
  }, [signedIn, setTheme])

  // Mode changes made in Settings land in next-themes; mirror them into the
  // store, which saves them only while signed in.
  useEffect(() => {
    if (!ready.current || !isThemeMode(theme)) return
    if (theme !== usePreferences.getState().theme) setSavedTheme(theme)
  }, [theme, setSavedTheme])

  return null
}
