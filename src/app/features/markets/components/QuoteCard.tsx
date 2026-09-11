import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

import type { Candle } from '../api/candles'
import type { Quote } from '../api/quotes'
import { Sparkline } from './Sparkline'

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

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
      <Card className="h-full transition-colors group-hover:border-primary">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{quote.symbol}</div>
              {name ? (
                <div className="truncate text-xs text-muted-foreground" title={name}>
                  {name}
                </div>
              ) : null}
            </div>
            <div
              className={`inline-flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums ${
                up ? 'text-primary' : 'text-destructive'
              }`}
            >
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {up ? '+' : ''}
              {quote.changePercent.toFixed(2)}%
            </div>
          </div>

          <div className="mt-2 text-lg font-semibold tabular-nums">
            {priceFormatter.format(quote.price)}
          </div>

          <div className="mt-2">
            <Sparkline candles={candles} rising={up} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
