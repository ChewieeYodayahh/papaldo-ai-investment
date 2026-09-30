import { describe, expect, it } from 'vitest'

import { hasTutorialCopy, translateTutorial } from './copy'
import { TOUR_HOME, TOUR_IDS, TOURS } from './tours'

describe('tours', () => {
  it('give every step an English title and body', () => {
    const missing = TOUR_IDS.flatMap((tour) =>
      TOURS[tour].flatMap((step) => [`${step.id}.title`, `${step.id}.body`].filter((key) => !hasTutorialCopy(key))),
    )
    expect(missing).toEqual([])
  })

  it('use each step id once, and each tour has a page to run on', () => {
    const ids = TOUR_IDS.flatMap((tour) => TOURS[tour].map((step) => step.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const tour of TOUR_IDS) expect(TOUR_HOME[tour]).toMatch(/^\//)
  })
})

describe('translateTutorial', () => {
  it('falls back to English, then to the key', () => {
    expect(translateTutorial('brainrot', 'ui.next')).toBe('Next W')
    expect(translateTutorial('brainrot', 'budget.pay.title')).toBe('Take-home pay')
    expect(translateTutorial('en', 'no.such.key')).toBe('no.such.key')
  })

  it('fills placeholders', () => {
    expect(translateTutorial('en', 'ui.step', { n: '2', m: '5' })).toBe('Step 2 of 5')
  })
})
