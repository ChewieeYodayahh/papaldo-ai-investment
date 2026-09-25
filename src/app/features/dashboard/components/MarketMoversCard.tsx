'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Movers, UniverseQuote } from '@/app/features/markets/api/movers'
import { Change } from '@/app/features/markets/components/Change'
import { SymbolMark } from '@/app/features/markets/components/SymbolMark'
import { PILL_LIST, PILL_TRIGGER } from '@/app/features/markets/components/pill-tabs'
import { Money } from '@/app/features/preferences/components/Money'
import { useCopy } from '@/app/features/preferences/copy'

function MoverRow({ quote }: { quote: UniverseQuote }) {
  return (
    <li>
      <Link
        href={`/markets/${encodeURIComponent(quote.symbol)}`}
        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent"
      >
        <SymbolMark symbol={quote.symbol} />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.8125rem] font-medium">{quote.symbol}</span>
          <span className="block truncate text-xs text-muted-foreground">{quote.name}</span>
        </span>
        <span className="text-right">
          <Money usd={quote.price} className="block text-[0.8125rem]" />
          <Change percent={quote.changePercent} className="text-xs" />
        </span>
      </Link>
    </li>
  )
}

/** Today's biggest moves in the buyable universe. */
export function MarketMoversCard({ movers, unavailable }: { movers: Movers | null; unavailable: string | null }) {
  const t = useCopy()

  return (
    <Card className="h-full rounded-2xl border-0 py-4">
      <CardContent className="flex h-full flex-col gap-2 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">{t('dash.markets')}</h2>
          <Link href="/markets" aria-label={t('dash.marketsPage')} className="rounded-full p-1 hover:bg-accent">
            <ArrowUpRight className="size-[1.125rem]" />
          </Link>
        </div>

        {movers ? (
          <Tabs defaultValue="gainers">
            <TabsList className={PILL_LIST}>
              <TabsTrigger value="gainers" className={PILL_TRIGGER}>
                {t('dash.gainers')}
              </TabsTrigger>
              <TabsTrigger value="losers" className={PILL_TRIGGER}>
                {t('dash.losers')}
              </TabsTrigger>
            </TabsList>
            {(['gainers', 'losers'] as const).map((side) => (
              <TabsContent key={side} value={side}>
                {movers[side].length > 0 ? (
                  <ul className="divide-y divide-border">
                    {movers[side].map((quote) => (
                      <MoverRow key={quote.symbol} quote={quote} />
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-sm text-muted-foreground">Nothing moving this way today.</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p className="py-6 text-sm text-muted-foreground">{unavailable}</p>
        )}
      </CardContent>
    </Card>
  )
}
