'use client'

import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import { Money } from '@/app/features/preferences/components/Money'
import { useCopy, type CopyKey } from '@/app/features/preferences/copy'

import type { SectorMove, UniverseQuote } from '../api/movers'
import { Change, SymbolMark } from './Change'
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

/**
 * Sector tiles, sized by how many buyable names the sector has and tinted by
 * its equal-weighted move. Tint strength scales with the move, capped at 3%,
 * mixed from the gain/loss tokens -- no colour is defined here.
 */
export function SectorHeatmap({ sectors }: { sectors: SectorMove[] }) {
  const t = useCopy()
  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="px-4">
        <h2 className="mb-3 text-base font-medium">{t('mkt.heatmap')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {sectors.map((s) => {
            const strength = Math.min(Math.abs(s.changePercent) / 3, 1)
            const token = s.changePercent >= 0 ? 'var(--gain)' : 'var(--loss)'
            return (
              <div
                key={s.sector}
                className="flex min-h-20 flex-col justify-between rounded-xl p-2.5 ring-1 ring-foreground/10"
                style={{
                  gridRow: `span ${s.symbols.length >= 12 ? 2 : 1}`,
                  backgroundColor: `color-mix(in oklch, ${token} ${Math.round(12 + strength * 45)}%, var(--card))`,
                }}
              >
                <span className="text-xs font-semibold">{s.sector}</span>
                <span>
                  <span className="figure block text-sm font-semibold">
                    {s.changePercent > 0 ? '+' : ''}
                    {s.changePercent.toFixed(2)}%
                  </span>
                  <span className="block truncate text-[0.625rem] opacity-80">
                    {s.symbols
                      .slice(0, 3)
                      .map((q) => q.symbol)
                      .join(' · ')}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
