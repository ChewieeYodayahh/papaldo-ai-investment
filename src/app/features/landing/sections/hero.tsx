import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { T } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import { MacBook } from '../components/devices'
import { MarketClock } from '../components/MarketClock'
import { Skyline } from '../components/Skyline'

/**
 * The hero (2026-10-02, "High Street Blue Hour"): what Papaldo is, in one
 * line, beside the real dashboard on a MacBook (50 | 50, Carlos), in front of
 * a BGC skyline, with the street ticker as the ground it stands on (rendered
 * by the page, straight after). Morning in light mode, blue hour in dark. The
 * phone layout gets its own section further down.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-linear-to-b from-sky-top to-sky-horizon">
      {/* The last of the sun (or the first), behind the towers. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_40%_at_78%_12%,color-mix(in_oklch,var(--window)_26%,transparent),transparent_72%)]"
      />
      <Skyline className="absolute inset-x-0 bottom-0 -z-10 h-[52%] w-full sm:h-[58%] lg:h-[28%]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-16 md:px-6 md:pt-20 lg:grid-cols-2 lg:gap-14 lg:pt-24 lg:pb-48">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="max-w-[17ch] font-display text-[2.35rem] leading-[1.04] font-semibold tracking-[-0.025em] text-balance font-stretch-[116%] sm:text-[3.25rem] lg:text-[3.1rem] xl:text-[3.5rem]">
            <T k="land.title" />
          </h1>
          <p className="mt-5 max-w-[36rem] text-base text-pretty text-foreground/80 sm:text-lg">
            <T k="land.body" />
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-full px-7 text-base font-semibold')}>
              <T k="land.cta" />
            </Link>
            <Link href="#how-it-works" className={cn(buttonVariants({ size: 'lg', variant: 'ghost' }), 'h-12 rounded-full px-5 text-base')}>
              <T k="land.secondary" />
            </Link>
          </div>
          <MarketClock className="mt-6 justify-center lg:justify-start" />
        </div>

        <MacBook
          shot="dashboard"
          priority
          alt="The Papaldo dashboard for a sample account: total holdings, risk appetite, today's biggest movers and the portfolio."
          sizes="(min-width: 1024px) 50vw, 92vw"
          className="mx-auto w-full max-w-2xl lg:max-w-none"
        />
      </div>
    </section>
  )
}
