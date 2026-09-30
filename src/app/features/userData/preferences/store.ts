'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Per-viewer display preferences: which currency figures render in, which
 * copy register the UI speaks, and which palette and font it wears.
 *
 * Browser-local on purpose. None of these change what the account *is* --
 * balances stay in USD in the database whatever the toggle says -- so they do
 * not earn a table, a migration and an RLS policy.
 *
 * Saved only while someone is signed in (Carlos, 2026-09-29). A guest can
 * change everything, but it lasts for the visit: the storage below ignores
 * reads and writes until `PreferencePersistence` switches it on for a
 * signed-in shell. Light/dark mode is applied by next-themes, which always
 * writes its own key, so the chosen mode is also kept here (`theme`) and
 * pushed back into next-themes after sign-in.
 *
 * `skipHydration` keeps the server render and the first client render
 * identical (defaults on both); `PreferencePersistence` rehydrates after
 * mount. Without it React reports a hydration mismatch for anyone who has
 * ever switched to pesos.
 */

export const CURRENCIES = ['USD', 'PHP'] as const
export type Currency = (typeof CURRENCIES)[number]

export const LANGUAGES = ['en', 'slang', 'brainrot'] as const
export type Language = (typeof LANGUAGES)[number]

export const PALETTES = ['forest', 'orchid', 'midnight'] as const
export type Palette = (typeof PALETTES)[number]

export const FONTS = ['figtree', 'geist', 'system'] as const
export type Font = (typeof FONTS)[number]

export const THEMES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEMES)[number]

/** Guests start here on every visit; signed-in users start from what they saved. */
export const DEFAULT_PREFERENCES = {
  currency: 'USD' as Currency,
  language: 'en' as Language,
  palette: 'forest' as Palette,
  font: 'figtree' as Font,
  theme: 'dark' as ThemeMode,
  notificationsSeenAt: null as string | null,
}

export const PREFERENCES_KEY = 'papaldo-preferences'

let persistenceEnabled = false

/** localStorage, but only while a signed-in shell has switched persistence on. */
const accountStorage = {
  getItem: (key: string) => (persistenceEnabled ? localStorage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    if (persistenceEnabled) localStorage.setItem(key, value)
  },
  removeItem: (key: string) => {
    if (persistenceEnabled) localStorage.removeItem(key)
  },
}

/**
 * Signed in: load the saved preferences and keep saving. Signed out: stop
 * saving and drop back to the defaults, so the next visitor on a shared
 * browser does not inherit the account's settings.
 */
export async function setPreferencePersistence(enabled: boolean) {
  if (enabled === persistenceEnabled) return
  persistenceEnabled = enabled
  if (enabled) await usePreferences.persist.rehydrate()
  else usePreferences.setState(DEFAULT_PREFERENCES)
}

type Preferences = {
  currency: Currency
  language: Language
  palette: Palette
  font: Font
  /** Light / dark / system, mirrored from next-themes so it is saved per account. */
  theme: ThemeMode
  /** ISO time the notification list was last opened. Drives the unread badge. */
  notificationsSeenAt: string | null
  setCurrency: (currency: Currency) => void
  setLanguage: (language: Language) => void
  setPalette: (palette: Palette) => void
  setFont: (font: Font) => void
  setTheme: (theme: ThemeMode) => void
  markNotificationsSeen: () => void
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      setPalette: (palette) => set({ palette }),
      setFont: (font) => set({ font }),
      setTheme: (theme) => set({ theme }),
      markNotificationsSeen: () => set({ notificationsSeenAt: new Date().toISOString() }),
    }),
    {
      name: PREFERENCES_KEY,
      // v2 added `theme`. Older saves adopt the mode next-themes last stored.
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<Preferences>
        if (version < 2) {
          let stored: string | null = null
          try {
            stored = localStorage.getItem('theme')
          } catch {
            stored = null
          }
          state.theme = (THEMES as readonly string[]).includes(stored ?? '') ? (stored as ThemeMode) : DEFAULT_PREFERENCES.theme
        }
        return state as Preferences
      },
      storage: createJSONStorage(() => accountStorage),
      skipHydration: true,
      partialize: ({ currency, language, palette, font, theme, notificationsSeenAt }) => ({
        currency,
        language,
        palette,
        font,
        theme,
        notificationsSeenAt,
      }),
    },
  ),
)
