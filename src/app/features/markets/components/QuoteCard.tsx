import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { Money } from '@/app/features/preferences/components/Money'

import type { Candle } from '../api/candles'
import type { Quote } from '../api/quotes'
import { Change } from './Change'
import { Sparkline } from './Sparkline'
import { SymbolMark } from './SymbolMark'

/**
 * One benchmark at a glance, sized like the dashboard's portfolio tiles so
 * four of them sit in a 2x2 window on a phone instead of four full-width
 * cards (Carlos, 2026-09-25). The arrow is the CTA, as on the dashboard's
 * Markets card; the whole tile leads to the symbol's trade page.
 */
export function QuoteCard({ quote, name, candles }: { quote: Quote; name?: string; candles: Candle[] }) {
  return (
    <Link
      href={`/markets/${encodeURIComponent(quote.symbol)}`}
      aria-label={`Trade ${quote.symbol}`}
      className="group flex min-w-0 flex-col gap-2 rounded-xl bg-radial from-accent/70 to-muted p-3 ring-1 ring-foreground/5 transition-shadow hover:ring-primary/60"
    >
      <div className="flex items-start gap-2">
        <SymbolMark symbol={quote.symbol} className="size-7" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-tight font-semibold">{quote.symbol}</span>
          {name ? <span className="block truncate text-[0.6875rem] text-muted-foreground">{name}</span> : null}
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <Money usd={quote.price} className="truncate text-[0.9375rem] font-semibold" />
        <Change percent={quote.changePercent} className="shrink-0 text-[0.6875rem]" />
      </div>

      <Sparkline candles={candles} rising={quote.change >= 0} className="h-9" />
    </Link>
  )
}
