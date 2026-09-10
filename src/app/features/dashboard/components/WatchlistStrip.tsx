import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

import type { FinnhubQuote } from '@/app/core/services/finnhub'
import type { MarketResult } from '../api/market'
import { marketUnavailableMessage } from '@/app/features/markets/market-status'

export function WatchlistStrip({ quotes }: { quotes: MarketResult<FinnhubQuote[]> }) {
  if (!quotes.ok) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        {marketUnavailableMessage(quotes.reason)} Everything else on this page is unaffected.
      </Card>
    )
  }

  const sorted = [...quotes.data].sort((a, b) => b.changePercent - a.changePercent)

  return (
    <Card className="overflow-hidden p-4">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Watchlist</h2>
        <Badge variant="outline" className="text-[10px]">
          Live · Finnhub
        </Badge>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Ranked within this fixed 7-symbol list only — not a market-wide top-gainers screen. Select a symbol
        for its detail page.
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {sorted.map((q) => {
          const up = q.change >= 0
          return (
            <Link
              key={q.symbol}
              href={`/markets/${q.symbol}`}
              className="flex min-w-[140px] flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-muted/50 focus-visible:border-primary focus-visible:outline-none"
            >
              <span className="text-sm font-semibold">{q.symbol}</span>
              <span className="tabular-nums text-sm">${q.current.toFixed(2)}</span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                  up ? 'text-primary' : 'text-destructive'
                }`}
              >
                {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {up ? '+' : ''}
                {q.changePercent.toFixed(2)}%
              </span>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
