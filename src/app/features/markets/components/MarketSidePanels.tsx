'use client'

import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import { Money } from '@/app/features/userData/preferences/components/Money'
import { useCopy, type CopyKey } from '@/app/features/userData/preferences/copy'

import type { UniverseQuote } from '../api/movers'
import { Change } from './Change'
import { SymbolMark } from './SymbolMark'
import { MiniTrend } from './MiniTrend'

export function MoversList({
  title,
  quotes,
  trends,
}: {
  title: CopyKey
  quotes: UniverseQuote[]
  trends: Record<string, number[]>
}) {
  const t = useCopy()
  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="px-4">
        <h2 className="mb-1 text-base font-medium">{t(title)}</h2>
        {quotes.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nothing moving this way today.</p>
        ) : (
          <ol>
            {quotes.map((q, i) => (
              <li key={q.symbol}>
                <Link
                  href={`/markets/${encodeURIComponent(q.symbol)}`}
                  className="grid grid-cols-[1rem_auto_1fr_auto_auto] items-center gap-3 rounded-xl px-1 py-2 hover:bg-accent"
                >
                  <span className="figure text-xs text-muted-foreground">{i + 1}</span>
                  <SymbolMark symbol={q.symbol} className="size-7 text-[9px]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{q.symbol}</span>
                    <Money usd={q.price} className="block text-xs text-muted-foreground" />
                  </span>
                  <MiniTrend closes={trends[q.symbol] ?? []} className="h-6 w-16" />
                  <Change percent={q.changePercent} className="w-16 justify-end text-sm" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
