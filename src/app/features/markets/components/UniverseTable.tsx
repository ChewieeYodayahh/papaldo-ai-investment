'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Money } from '@/app/features/userData/preferences/components/Money'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { UniverseQuote } from '../api/movers'
import { Change } from './Change'
import { MiniTrend } from './MiniTrend'
import { PILL_LIST, PILL_TRIGGER } from './pill-tabs'
import { SymbolMark } from './SymbolMark'

const volumeFormat = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/** Rows visible before the table scrolls inside its own window. */
const VISIBLE_ROWS = 8

/**
 * Every buyable name, live. Sector tabs filter in the browser -- it is forty
 * rows, already on the page -- unlike the full catalogue below, which filters
 * on the server because it is thousands.
 *
 * The table scrolls inside a window of about eight rows, on every filter,
 * with the header pinned (Carlos, 2026-09-25): forty rows at full length
 * pushed the movers and the catalogue a phone's-length away. A floating
 * button jumps to the end of the list and back.
 *
 * On a phone the row drops to what fits: logo, ticker, price with the day's
 * change under it, and an arrow to the trade page.
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
  const scrolls = rows.length > VISIBLE_ROWS

  // The shadcn ScrollArea forwards its ref to the root; the viewport inside
  // it is the element that actually scrolls.
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [atEnd, setAtEnd] = useState(false)
  const viewport = useCallback(
    () => rootRef.current?.querySelector<HTMLElement>('[data-slot=scroll-area-viewport]') ?? null,
    [],
  )

  useEffect(() => {
    const el = viewport()
    if (!el) return
    el.scrollTo({ top: 0 })
    setAtEnd(false)
    const onScroll = () => setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 8)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [sector, viewport])

  function jump() {
    const el = viewport()
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: atEnd ? 0 : el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="space-y-3 px-4">
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

        <div className="relative">
          <ScrollArea
            ref={rootRef}
            // The viewport gets the height cap and does all the scrolling,
            // both ways. The table's own overflow-x wrapper is flattened so
            // the sticky header pins to this viewport rather than to it.
            className={cn(
              '[&_[data-slot=table-container]]:overflow-visible',
              scrolls && '[&>[data-slot=scroll-area-viewport]]:max-h-[27.5rem]',
            )}
          >
            <Table className="text-[0.8125rem]">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="hidden w-8 sm:table-cell">#</TableHead>
                  <TableHead>{t('mkt.symbol')}</TableHead>
                  <TableHead className="text-right">{t('mkt.price')}</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">{t('mkt.change')}</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">{t('mkt.range')}</TableHead>
                  <TableHead className="hidden text-right md:table-cell">{t('mkt.volume')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('mkt.trend')}</TableHead>
                  <TableHead className="w-10 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((q, i) => (
                  <TableRow key={q.symbol}>
                    <TableCell className="figure hidden text-muted-foreground sm:table-cell">{i + 1}</TableCell>
                    <TableCell>
                      <Link href={`/markets/${encodeURIComponent(q.symbol)}`} className="flex min-w-0 items-center gap-2.5">
                        <SymbolMark symbol={q.symbol} />
                        <span className="min-w-0">
                          <span className="block font-medium">{q.symbol}</span>
                          <span className="block max-w-[7.5rem] truncate text-xs text-muted-foreground sm:max-w-48">{q.name}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Money usd={q.price} className="block" />
                      {/* On a phone the change rides under the price instead of taking a column. */}
                      <Change percent={q.changePercent} className="text-xs sm:hidden" />
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      <Change percent={q.changePercent} />
                    </TableCell>
                    <TableCell className="hidden text-right text-xs text-muted-foreground lg:table-cell">
                      <Money usd={q.low} /> – <Money usd={q.high} />
                    </TableCell>
                    <TableCell className="figure hidden text-right text-muted-foreground md:table-cell">
                      {volumeFormat.format(q.volume)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <MiniTrend closes={trends[q.symbol] ?? []} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/markets/${encodeURIComponent(q.symbol)}`}
                        aria-label={`${t('mkt.trade')} ${q.symbol}`}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'border-primary/50 px-2 text-primary sm:px-2.5',
                        )}
                      >
                        <span className="hidden sm:inline">{t('mkt.trade')}</span>
                        <ArrowUpRight className="size-4 sm:hidden" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {scrolls ? (
            <>
              {/* A fade at the lower edge says the list continues. */}
              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card to-transparent transition-opacity',
                  atEnd && 'opacity-0',
                )}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={jump}
                aria-label={atEnd ? 'Back to the top of the list' : 'Jump to the end of the list'}
                className="absolute right-2 bottom-2 z-20 rounded-full shadow-lg"
              >
                {atEnd ? <ArrowUp /> : <ArrowDown />}
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
