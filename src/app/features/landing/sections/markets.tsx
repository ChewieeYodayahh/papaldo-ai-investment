import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { MacBook } from '../components/devices'

/**
 * Real prices, real companies (2026-10-02): the sector heatmap on a MacBook,
 * and the way into the markets and the PSEi comparison.
 */
export function MarketsSection() {
  return (
    <section aria-labelledby="markets-title" className="border-t border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-2 lg:gap-14">
        <div className="lg:order-last">
          <h2 id="markets-title" className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance font-stretch-[112%] sm:text-4xl">
            Real prices, real companies
          </h2>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">
            Papaldo follows 70 US companies and funds across twelve sectors, from Apple and Coca-Cola to an S&amp;P 500
            index fund, at their real prices. The heatmap shows the whole day at a glance: the bigger the tile, the bigger the company.
          </p>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">
            Closer to home, you can see how the PSEi has done against the New York markets over fifteen years.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/markets" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-11 rounded-full px-6 font-semibold')}>
              Open the markets
            </Link>
            <Link href="/markets/benchmarks" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-11 rounded-full px-5')}>
              Compare the PSEi
            </Link>
          </div>
        </div>
        <MacBook
          shot="markets"
          alt="The sector heatmap in the Papaldo app: every company a tile, sized by its value and coloured by the day's move."
          sizes="(min-width: 1024px) 50vw, 92vw"
          className="mx-auto w-full max-w-2xl lg:max-w-none"
        />
      </div>
    </section>
  )
}
