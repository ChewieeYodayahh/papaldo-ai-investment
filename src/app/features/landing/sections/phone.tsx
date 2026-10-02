import { IPhone, type PhoneShot } from '../components/devices'

const PHONES: Array<{ shot: PhoneShot; caption: string; alt: string }> = [
  {
    shot: 'dashboard',
    caption: 'Your holdings at a glance',
    alt: 'The Papaldo dashboard on a phone, for a sample account: total holdings, risk appetite and the day’s biggest movers.',
  },
  {
    shot: 'trade',
    caption: 'Check every order first',
    alt: 'A practice order on a phone: the confirmation for ten shares of an S&P 500 fund, with the estimated cost and the cash left after.',
  },
]

/**
 * Works on your phone too (2026-10-02): the app's real phone layout on two
 * iPhones, on their own so each is big enough to read. Half and half with the
 * words on a wide screen (Carlos's 50 | 50 rule), the second phone set a
 * little lower; on a phone, a sideways swipe with the next one peeking in.
 */
export function PhoneSection() {
  return (
    <section aria-labelledby="phone-title" className="border-t border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 id="phone-title" className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance font-stretch-[112%] sm:text-4xl">
            Works on your phone too
          </h2>
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">
            Every page is built for a phone first. Check your practice portfolio, place an order or finish a lesson on the jeep
            home, with nothing to install.
          </p>
        </div>

        <ul className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-8">
          {PHONES.map((phone, i) => (
            <li key={phone.shot} className={i === 1 ? 'w-[72%] shrink-0 snap-center sm:w-auto sm:pt-12' : 'w-[72%] shrink-0 snap-center sm:w-auto'}>
              <IPhone shot={phone.shot} alt={phone.alt} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 72vw" className="mx-auto w-full max-w-[17rem]" />
              <p className="mt-5 text-center text-sm font-medium text-foreground/80">{phone.caption}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
