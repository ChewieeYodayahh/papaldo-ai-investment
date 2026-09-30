import type { Language } from '@/app/features/userData/preferences/store'

/**
 * The Home header greeting (Carlos, 2026-09-25). The viewer's first name
 * follows the comma.
 *
 * Rotation rule: one greeting per **session window** -- five minutes,
 * counted from the moment the user signed in. It stays put across reloads
 * inside a window, moves on when the window rolls over, and starts over on a
 * fresh sign-in. Nothing is stored for this: the window and the Supabase
 * session id together decide it, so the server renders the final greeting and
 * there is no flash on hydration.
 *
 * Consecutive windows step through the pool rather than re-rolling, so the
 * same greeting never shows twice in a row.
 */

export const GREETING_WINDOW_MS = 5 * 60 * 1000

export const GREETINGS: Record<Language, readonly string[]> = {
  en: ['Let’s Get Wealthy', 'PAPALDO KA', 'We gon be rich homie', 'Stacking up', 'Time to print'],
  slang: ['PAPALDO KA', 'Let’s get this bread', 'Money moves only', 'Bag secured', 'Big moves today'],
  brainrot: ['PAPALDO KA', 'Sigma grindset activated', 'Aura farming rn', 'Mogging the market', 'Stonks go brrr', 'No cap, we eating'],
}

/**
 * Easter egg: roughly one session window in forty gets a rare line instead.
 * Decided by the same seed, so it lasts the whole window once found.
 */
export const RARE_GREETINGS: Record<Language, string> = {
  en: 'Legend status unlocked',
  slang: 'Certified money maker',
  brainrot: 'Ohio-proof portfolio, +1000 aura',
}
const RARE_ODDS = 40

/** FNV-1a, 32-bit. Stable across server and browser; good enough to scatter seeds. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * A number that is constant within one five-minute window of one session.
 * Signed out there is no session, so windows are counted from the epoch.
 */
export function greetingSeed(
  session: { id: string; sessionId: string | null; signedInAt: number | null } | null,
  now: number = Date.now(),
): number {
  if (!session) return Math.floor(now / GREETING_WINDOW_MS)
  const start = (session.signedInAt ?? 0) * 1000
  const window = Math.max(0, Math.floor((now - start) / GREETING_WINDOW_MS))
  return hash(session.sessionId ?? session.id) + window
}

export function pickGreeting(language: Language, seed: number): string {
  // The rare check uses a scrambled seed so it does not line up with the pool step.
  if (hash(String(seed)) % RARE_ODDS === 0) return RARE_GREETINGS[language]
  const pool = GREETINGS[language]
  return pool[seed % pool.length]
}
