import { describe, expect, it } from 'vitest'

import { marketMoment } from './market-hours'

describe('marketMoment', () => {
  it('before the open, says it opens tonight in Manila', () => {
    // Thursday 7:42 PM in Manila is 7:42 AM in New York (EDT).
    const moment = marketMoment(new Date('2026-10-01T11:42:00Z'))
    expect(moment).toEqual({ manilaTime: '7:42 PM', open: false, next: '9:30 PM', nextDay: null })
  })

  it('during the session, says when it closes (after midnight in Manila)', () => {
    // 10:00 AM in New York is 10:00 PM in Manila; 4:00 PM New York is 4:00 AM Manila.
    const moment = marketMoment(new Date('2026-10-01T14:00:00Z'))
    expect(moment.open).toBe(true)
    expect(moment.next).toBe('4:00 AM')
    expect(moment.nextDay).toBe('tomorrow')
  })

  it('over the weekend, waits for Monday night in Manila', () => {
    // Saturday 11:00 AM in Manila (Friday 11 PM in New York).
    const moment = marketMoment(new Date('2026-10-03T03:00:00Z'))
    expect(moment).toEqual({ manilaTime: '11:00 AM', open: false, next: '9:30 PM', nextDay: 'Monday' })
  })

  it('moves an hour later in Manila once New York leaves daylight saving', () => {
    // Monday 2 Nov 2026, 6:00 AM in New York (EST) = 7:00 PM in Manila; the open is 9:30 AM EST = 10:30 PM Manila.
    const moment = marketMoment(new Date('2026-11-02T11:00:00Z'))
    expect(moment).toEqual({ manilaTime: '7:00 PM', open: false, next: '10:30 PM', nextDay: null })
  })

  it('crosses the clock change over a weekend', () => {
    // Saturday 31 Oct 2026, noon in Manila (EDT); the next open is Monday 2 Nov, after the change (EST).
    const moment = marketMoment(new Date('2026-10-31T04:00:00Z'))
    expect(moment.next).toBe('10:30 PM')
    expect(moment.nextDay).toBe('Monday')
  })
})
