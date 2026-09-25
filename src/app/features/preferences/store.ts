'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Per-viewer display preferences: which currency figures render in, which
 * copy register the UI speaks, and which palette and font it wears.
 *
 * Browser-local on purpose. None of these change what the account *is* --
 * balances stay in USD in the database whatever the toggle says -- so they do
 * not earn a table, a migration and an RLS policy. Light/dark mode is not
 * here; next-themes already owns it.
 *
 * `skipHydration` keeps the server render and the first client render
 * identical (defaults on both); `PreferencesEffects` rehydrates after mount.
 * Without it React reports a hydration mismatch for anyone who has ever
 * switched to pesos.
 */

export const CURRENCIES = ['USD', 'PHP'] as const
export type Currency = (typeof CURRENCIES)[number]

export const LANGUAGES = ['en', 'slang', 'brainrot'] as const
export type Language = (typeof LANGUAGES)[number]

export const PALETTES = ['forest', 'orchid', 'midnight'] as const
export type Palette = (typeof PALETTES)[number]

export const FONTS = ['figtree', 'geist', 'system'] as const
export type Font = (typeof FONTS)[number]

type Preferences = {
  currency: Currency
  language: Language
  palette: Palette
  font: Font
  /** ISO time the notification list was last opened. Drives the unread badge. */
  notificationsSeenAt: string | null
  setCurrency: (currency: Currency) => void
  setLanguage: (language: Language) => void
  setPalette: (palette: Palette) => void
  setFont: (font: Font) => void
  markNotificationsSeen: () => void
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      currency: 'USD',
      language: 'en',
      palette: 'forest',
      font: 'figtree',
      notificationsSeenAt: null,
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      setPalette: (palette) => set({ palette }),
      setFont: (font) => set({ font }),
      markNotificationsSeen: () => set({ notificationsSeenAt: new Date().toISOString() }),
    }),
    {
      name: 'papaldo-preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ currency, language, palette, font, notificationsSeenAt }) => ({
        currency,
        language,
        palette,
        font,
        notificationsSeenAt,
      }),
    },
  ),
)
