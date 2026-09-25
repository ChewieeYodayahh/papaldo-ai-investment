'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Money } from '@/app/features/preferences/components/Money'
import { useCopy } from '@/app/features/preferences/copy'
import { cn } from '@/lib/utils'

import type { UniverseQuote } from '../api/movers'
import { Change, SymbolMark } from './Change'
import { MiniTrend } from './MiniTrend'
import { PILL_LIST, PILL_TRIGGER } from './pill-tabs'

const volumeFormat = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * Every buyable name, live. Sector tabs filter in the browser -- it is forty
 * rows, already on the page -- unlike the full catalogue below, which filters
 * on the server because it is thousands.
 */
export function UniverseTable({
  quotes,
  trends,
}: {
  quotes: UniverseQuote[]
  /** Recent closes per symbol, oldest first. */
  trends: Record<string, number[]>
}) {
  const t = useCopy()
  const [sector, setSector] = useState('all')
  const sectors = useMemo(() => [...new Set(quotes.map((q) => q.sector))].sort(), [quotes])
  const rows = sector === 'all' ? quotes : quotes.filter((q) => q.sector === sector)

  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="space-y-4 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium">{t('mkt.universe')}</h2>
          <Tabs value={sector} onValueChange={(value) => setSector(String(value))}>
            <TabsList className={cn(PILL_LIST, 'flex-wrap')}>
              <TabsTrigger value="all" className={PILL_TRIGGER}>
                {t('mkt.all')}
              </TabsTrigger>
              {sectors.map((s) => (
                <TabsTrigger key={s} value={s} className={PILL_TRIGGER}>
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Table className="text-[0.8125rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t('mkt.symbol')}</TableHead>
              <TableHead className="text-right">{t('mkt.price')}</TableHead>
              <TableHead className="text-right">{t('mkt.change')}</TableHead>
              <TableHead className="hidden text-right lg:table-cell">{t('mkt.range')}</TableHead>
              <TableHead className="hidden text-right md:table-cell">{t('mkt.volume')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('mkt.trend')}</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((q, i) => (
              <TableRow key={q.symbol}>
                <TableCell className="figure text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <Link href={`/markets/${encodeURIComponent(q.symbol)}`} className="flex items-center gap-3">
                    <SymbolMark symbol={q.symbol} className="size-8 text-[10px]" />
                    <span className="min-w-0">
                      <span className="block font-medium">{q.symbol}</span>
                      <span className="block max-w-48 truncate text-xs text-muted-foreground">{q.name}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <Money usd={q.price} />
                </TableCell>
                <TableCell className="text-right">
                  <Change percent={q.changePercent} />
                </TableCell>
                <TableCell className="hidden text-right text-xs text-muted-foreground lg:table-cell">
                  <Money usd={q.low} /> – <Money usd={q.high} />
                </TableCell>
                <TableCell className="figure hidden text-right text-muted-foreground md:table-cell">
                  {volumeFormat.format(q.volume)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <MiniTrend closes={trends[q.symbol] ?? []} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/markets/${encodeURIComponent(q.symbol)}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border-primary/60 text-primary')}
                  >
                    {t('mkt.trade')}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
