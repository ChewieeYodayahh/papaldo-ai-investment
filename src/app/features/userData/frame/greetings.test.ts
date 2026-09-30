import { describe, expect, it } from 'vitest'

import { GREETING_WINDOW_MS, GREETINGS, greetingSeed, pickGreeting, RARE_GREETINGS } from './greetings'

const signIn = 1_790_000_000 // unix seconds
const session = { id: 'user-1', sessionId: 'session-a', signedInAt: signIn }
const at = (minutes: number) => signIn * 1000 + minutes * 60_000

describe('greetingSeed', () => {
  it('holds steady for the whole five-minute window', () => {
    expect(greetingSeed(session, at(0))).toBe(greetingSeed(session, at(4.9)))
  })

  it('moves on when the window rolls over', () => {
    expect(greetingSeed(session, at(5))).toBe(greetingSeed(session, at(0)) + 1)
  })

  it('starts somewhere new on a fresh sign-in', () => {
    const next = { ...session, sessionId: 'session-b' }
    expect(greetingSeed(next, at(0))).not.toBe(greetingSeed(session, at(0)))
  })

  it('still rotates every five minutes when signed out', () => {
    expect(greetingSeed(null, GREETING_WINDOW_MS * 7)).toBe(7)
  })
})

describe('pickGreeting', () => {
  it('never shows the same line in two consecutive windows', () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const a = pickGreeting('en', seed)
      const b = pickGreeting('en', seed + 1)
      if (a !== RARE_GREETINGS.en && b !== RARE_GREETINGS.en) expect(a).not.toBe(b)
    }
  })

  it('draws from the pool of the chosen register', () => {
    const line = pickGreeting('brainrot', 3)
    expect([...GREETINGS.brainrot, RARE_GREETINGS.brainrot]).toContain(line)
  })

  it('surfaces the easter egg occasionally, not never and not often', () => {
    const rare = Array.from({ length: 4000 }, (_, seed) => pickGreeting('en', seed)).filter(
      (line) => line === RARE_GREETINGS.en,
    ).length
    expect(rare).toBeGreaterThan(40)
    expect(rare).toBeLessThan(200)
  })
})
