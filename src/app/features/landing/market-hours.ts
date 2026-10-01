/**
 * The US market's regular session, read from Manila (2026-10-02): the
 * landing page's clock says when the market opens or closes in Manila time.
 * The session is 9:30 AM to 4:00 PM New York time on weekdays; New York's
 * daylight-saving changes move it an hour in Manila, which the time zone
 * database handles. US market holidays are not modelled: on one, the line
 * says the market opens when it does not.
 */

const OPEN_MINUTE = 9 * 60 + 30
const CLOSE_MINUTE = 16 * 60

const NEW_YORK = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

const MANILA_TIME = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' })
const MANILA_DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'long' })
const MANILA_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' })

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** New York's weekday (0 = Sunday) and minute of the day at `at`. */
function newYorkClock(at: Date): { day: number; minute: number } {
  const parts = Object.fromEntries(NEW_YORK.formatToParts(at).map((part) => [part.type, part.value]))
  return { day: WEEKDAYS.indexOf(parts.weekday), minute: Number(parts.hour) * 60 + Number(parts.minute) }
}

const isWeekday = (day: number) => day >= 1 && day <= 5

/**
 * The instant New York's wall clock next reads `minute` on a weekday, at or
 * after `from`. Steps in New York minutes, then corrects for a clock change
 * in between by re-reading the clock at the result.
 */
function nextWeekdayMinute(from: Date, minute: number): Date {
  const { day, minute: now } = newYorkClock(from)
  let days = 0
  let d = day
  if (now >= minute || !isWeekday(day)) {
    do {
      days++
      d = (d + 1) % 7
    } while (!isWeekday(d))
  }
  let at = new Date(from.getTime() + (days * 1440 + (minute - now)) * 60_000)
  // Across a daylight-saving change the wall clock is an hour off: nudge back onto it.
  const drift = newYorkClock(at).minute - minute
  if (drift !== 0) at = new Date(at.getTime() - drift * 60_000)
  return new Date(Math.floor(at.getTime() / 60_000) * 60_000)
}

export type MarketMoment = {
  /** "7:42 PM" in Manila. */
  manilaTime: string
  open: boolean
  /** When the market next opens (closed) or closes (open), in Manila time. */
  next: string
  /** The Manila weekday of `next` when it is not today, e.g. "Monday". */
  nextDay: string | null
}

export function marketMoment(now: Date): MarketMoment {
  const { day, minute } = newYorkClock(now)
  const open = isWeekday(day) && minute >= OPEN_MINUTE && minute < CLOSE_MINUTE
  const next = open ? nextWeekdayMinute(now, CLOSE_MINUTE) : nextWeekdayMinute(now, OPEN_MINUTE)
  const sameDay = MANILA_DATE.format(next) === MANILA_DATE.format(now)
  const tomorrow = MANILA_DATE.format(next) === MANILA_DATE.format(new Date(now.getTime() + 86_400_000))
  return {
    manilaTime: MANILA_TIME.format(now),
    open,
    next: MANILA_TIME.format(next),
    nextDay: sameDay ? null : tomorrow ? 'tomorrow' : MANILA_DAY.format(next),
  }
}
