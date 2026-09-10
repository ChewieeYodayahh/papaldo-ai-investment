import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

import type { FinnhubQuote } from '@/app/core/services/finnhub'

export function WatchlistStrip({ quotes }: { quotes: FinnhubQuote[] | null }) {
  if (!quotes) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Live quotes are unavailable right now — Finnhub did not respond. Everything else on this page is
        unaffected.
      </Card>
    )
  }

  const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent)

  return (
    <Card className="overflow-hidden p-4">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Watchlist</h2>
        <Badge variant="outline" className="text-[10px]">
          Live · Finnhub
        </Badge>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Ranked within this fixed 7-symbol list only — not a market-wide top-gainers screen.
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {sorted.map((q) => {
          const up = q.change >= 0
          return (
            <div
              key={q.symbol}
              className="flex min-w-[140px] flex-col gap-1 rounded-lg border border-border p-3"
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
            </div>
          )
        })}
      </div>
    </Card>
  )
}
