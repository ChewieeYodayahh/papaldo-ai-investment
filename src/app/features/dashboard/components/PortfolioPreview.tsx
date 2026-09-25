'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight, Compass } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Change, SymbolMark } from '@/app/features/markets/components/Change'
import { Money } from '@/app/features/preferences/components/Money'
import { useCopy } from '@/app/features/preferences/copy'
import { cn } from '@/lib/utils'

import type { AllocationSlice, ValuedPosition } from '../portfolio-math'
import { AllocationPie } from './AllocationPie'

const TILE_COUNT = 4

function pnlPercent(p: ValuedPosition): number {
  return p.costBasis > 0 ? (p.unrealized / p.costBasis) * 100 : 0
}

function PositionTile({ position }: { position: ValuedPosition }) {
  const t = useCopy()
  return (
    <Link
      href={`/markets/${encodeURIComponent(position.symbol)}`}
      className="flex min-w-0 flex-col justify-between gap-4 rounded-xl bg-radial from-accent/70 to-muted p-3 ring-1 ring-foreground/5 transition-colors hover:ring-primary/60"
    >
      <div className="min-w-0">
        <Money usd={position.value} className="block truncate text-[0.9375rem] font-semibold" />
        <Change percent={pnlPercent(position)} className="text-[0.6875rem]" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <SymbolMark symbol={position.symbol} className="size-6 text-[0.5rem]" />
          <span className="truncate text-xs font-medium">{position.symbol}</span>
        </div>
        <span className="shrink-0 text-[0.6875rem] whitespace-nowrap text-muted-foreground">
          {t('dash.units')} <span className="figure font-semibold text-foreground">{position.quantity}</span>
        </span>
      </div>
    </Link>
  )
}

/**
 * "My Portfolio": the four largest positions, with See all opening the
 * breakdown dialog.
 *
 * Keeps the three empty states the old My Assets card had, because "no
 * positions" means different things: no risk profile invites the quiz;
 * profile but no buys points at the markets.
 */
export function PortfolioPreview({
  positions,
  allocation,
  hasRiskProfile,
}: {
  positions: ValuedPosition[]
  allocation: AllocationSlice[]
  hasRiskProfile: boolean
}) {
  const t = useCopy()
  const [open, setOpen] = useState(false)
  const tiles = positions.slice(0, TILE_COUNT)

  return (
    <Card className="h-full rounded-2xl border-0 py-4">
      <CardContent className="flex h-full flex-col gap-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-medium">{t('dash.myPortfolio')}</h2>
          <Button variant="secondary" size="sm" className="rounded-full px-3.5" onClick={() => setOpen(true)}>
            {t('dash.seeAll')}
          </Button>
        </div>

        {tiles.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {tiles.map((p) => (
              <PositionTile key={p.symbol} position={p} />
            ))}
            {Array.from({ length: TILE_COUNT - tiles.length }).map((_, i) => (
              <div key={i} aria-hidden className="min-h-24 rounded-xl bg-radial from-accent/40 to-muted/60" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-radial from-accent/50 to-muted p-6 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              {hasRiskProfile ? t('dash.emptyPortfolio') : t('dash.blurb.none')}
            </p>
            {hasRiskProfile ? (
              <Link href="/markets" className={cn(buttonVariants({ variant: 'secondary' }), 'rounded-full px-5')}>
                {t('dash.browseMarkets')}
              </Link>
            ) : (
              <Link href="/isq" className={cn(buttonVariants(), 'rounded-full px-5')}>
                <Compass className="size-4" />
                {t('dash.whatIsProfile')}
              </Link>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88svh] gap-5 overflow-y-auto rounded-2xl p-5 ring-2 ring-primary/60 sm:max-w-3xl sm:p-6">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="mr-auto text-xl font-medium">{t('dash.yourPortfolio')}</DialogTitle>
            <Link href="/markets" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'rounded-full px-3.5')}>
              {t('dash.marketsPage')}
            </Link>
            <Link href="/portfolio" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'rounded-full px-3.5')}>
              {t('dash.portfolioPage')}
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="mb-4 text-sm text-muted-foreground">{t('dash.bySector')}</h3>
              <AllocationPie slices={allocation} muted={!hasRiskProfile} />
            </section>

            <section>
              <h3 className="mb-1 text-sm text-muted-foreground">{t('dash.topHoldings')}</h3>
              {positions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dash.emptyPortfolio')}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {positions.slice(0, 6).map((p) => (
                    <li key={p.symbol}>
                      <Link
                        href={`/markets/${encodeURIComponent(p.symbol)}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-accent"
                      >
                        <SymbolMark symbol={p.symbol} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{p.symbol}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.sector} · <span className="figure">{p.quantity}</span> {t('dash.units').toLowerCase()}
                          </span>
                        </span>
                        <span className="text-right">
                          <Money usd={p.value} className="block" />
                          <Change percent={pnlPercent(p)} className="text-xs" />
                        </span>
                        <ArrowUpRight className="size-4 shrink-0" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
