import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import { Money } from '@/app/features/preferences/components/Money'

import type { Candle } from '../api/candles'
import type { Quote } from '../api/quotes'
import { Change } from './Change'
import { Sparkline } from './Sparkline'

/**
 * One symbol at a glance: live Alpaca price, today's move, and a thumbnail of
 * the last month of real daily closes.
 *
 * `name` is Alpaca's official asset name rather than anything typed here, so a
 * ticker always renders as the venue records it.
 */
export function QuoteCard({
  quote,
  name,
  candles,
}: {
  quote: Quote
  name?: string
  candles: Candle[]
}) {
  const up = quote.change >= 0

  return (
    <Link href={`/markets/${encodeURIComponent(quote.symbol)}`} className="group">
      <Card className="h-full rounded-2xl border-0 transition-shadow group-hover:ring-primary/60">
        <CardContent className="px-3.5 py-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{quote.symbol}</div>
              {name ? (
                <div className="truncate text-xs text-muted-foreground" title={name}>
                  {name}
                </div>
              ) : null}
            </div>
            <Change percent={quote.changePercent} arrow className="shrink-0 text-xs font-medium" />
          </div>

          <Money usd={quote.price} className="mt-1.5 block text-base font-semibold" />

          <div className="mt-2">
            <Sparkline candles={candles} rising={up} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
