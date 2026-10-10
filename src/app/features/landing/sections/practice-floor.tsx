import { T } from '@/app/features/userData/preferences/copy'

/**
 * "A practice floor, not a casino" (2026-10-02): the gambling worry,
 * answered with what the app actually does. Each line is enforced by the
 * code, not just promised: cash and holdings are checked by place_order
 * (PA001, PA002), and there are no streaks, badges or prizes anywhere.
 */
const PROMISES = [
  {
    title: 'Practice money only',
    body: 'You start with $100,000 that is not real. There is nothing to deposit, nothing to withdraw, and no broker on the other end.',
  },
  {
    title: 'Only the cash you have',
    body: 'No margin and no borrowing. An order that costs more than your practice cash does not go through.',
  },
  {
    title: 'Only the shares you hold',
    body: 'No short selling. You can sell what you own, and nothing more.',
  },
  {
    title: 'No prizes for trading more',
    body: 'No streaks and no badges for pressing buy. Holding still is a fine move.',
  },
] as const

export function PracticeFloor() {
  return (
    <section aria-labelledby="floor-title" className="border-t border-border bg-street-raised/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h2 id="floor-title" className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance font-stretch-[112%] sm:text-4xl">
            <T k="land.floor.title" />
          </h2>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">
            <T k="land.floor.sub" />
          </p>
        </div>
        <dl className="divide-y divide-border border-y border-border">
          {PROMISES.map((promise) => (
            <div key={promise.title} className="grid gap-1.5 py-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
              <dt className="font-semibold">{promise.title}</dt>
              <dd className="text-pretty text-muted-foreground">{promise.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
