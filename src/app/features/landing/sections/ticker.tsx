import Link from 'next/link'

import { getUniverseQuotes } from '@/app/features/markets/api/movers'
import { cn } from '@/lib/utils'

const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

/**
 * The street-level LED board along the skyline's base (2026-10-02): every
 * name Papaldo trades, at its real price and today's move, drifting slowly
 * (paused while hovered or focused; still under reduced motion). The quotes
 * are the same cached Alpaca snapshots /markets uses. If they are not
 * available, the band is simply left out.
 */
export async function Ticker() {
  const quotes = await getUniverseQuotes()
  if (!quotes.ok || quotes.data.length === 0) return null

  // Largest companies first, then the funds.
  const items = [...quotes.data].sort((a, b) => (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0))

  return (
    <section aria-labelledby="ticker-title" className="ticker relative overflow-hidden border-y border-border bg-street">
      <h2 id="ticker-title" className="sr-only">
        Today&apos;s prices for the companies and funds Papaldo trades
      </h2>
      <div className="ticker-track flex w-max">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1 || undefined}
            className="flex shrink-0 items-center gap-9 py-3.5 pr-9 font-display text-[0.9375rem] font-stretch-condensed"
          >
            {items.map((quote) => (
              <li key={quote.symbol} className="flex items-baseline gap-2.5 whitespace-nowrap">
                <span className="font-semibold tracking-wide">{quote.symbol}</span>
                <span className="figure text-muted-foreground">{price.format(quote.price)}</span>
                <span className={cn('figure', quote.changePercent > 0 ? 'text-gain' : quote.changePercent < 0 ? 'text-loss' : 'text-muted-foreground')}>
                  {quote.changePercent > 0 ? '+' : ''}
                  {quote.changePercent.toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <Link
        href="/markets"
        className="absolute inset-y-0 right-0 flex items-center bg-linear-to-l from-street from-60% to-transparent pr-4 pl-12 text-sm font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none sm:pr-6"
      >
        All markets
      </Link>
    </section>
  )
}

/** Holds the band's height while the quotes load. */
export function TickerFallback() {
  return <div aria-hidden className="h-[3.25rem] border-y border-border bg-street" />
}
