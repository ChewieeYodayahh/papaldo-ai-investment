'use client'

import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Change } from '@/app/features/markets/components/Change'
import { SymbolMark } from '@/app/features/markets/components/SymbolMark'
import { Money } from '@/app/features/userData/preferences/components/Money'
import { useCopy } from '@/app/features/userData/preferences/copy'

import type { AllocationSlice, ValuedPosition } from '../portfolio-math'
import { AllocationPie } from './AllocationPie'

export function PositionsTable({ positions }: { positions: ValuedPosition[] }) {
  const t = useCopy()

  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="px-4">
        <h2 className="mb-3 text-base font-medium">{t('dash.topHoldings')}</h2>
        {positions.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{t('dash.emptyPortfolio')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('mkt.symbol')}</TableHead>
                <TableHead className="text-right">{t('dash.units')}</TableHead>
                <TableHead className="text-right">Avg cost</TableHead>
                <TableHead className="text-right">{t('mkt.price')}</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Unrealized</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((p) => (
                <TableRow key={p.symbol}>
                  <TableCell>
                    <Link href={`/markets/${encodeURIComponent(p.symbol)}`} className="flex items-center gap-3">
                      <SymbolMark symbol={p.symbol} className="size-8 text-[10px]" />
                      <span>
                        <span className="block font-medium">{p.symbol}</span>
                        <span className="block text-xs text-muted-foreground">{p.sector}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="figure text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">
                    <Money usd={p.avgCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money usd={p.price} />
                    {p.live ? null : <span className="block text-[10px] text-muted-foreground">at cost</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <Money usd={p.value} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money usd={p.unrealized} signed className={p.unrealized >= 0 ? 'text-gain' : 'text-loss'} />
                    <Change
                      percent={p.costBasis > 0 ? (p.unrealized / p.costBasis) * 100 : 0}
                      className="block text-xs"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export function AllocationCard({ slices, muted }: { slices: AllocationSlice[]; muted: boolean }) {
  const t = useCopy()
  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="px-4">
        <h2 className="mb-4 text-base font-medium">{t('dash.bySector')}</h2>
        <AllocationPie slices={slices} muted={muted} className="sm:grid-cols-1" />
      </CardContent>
    </Card>
  )
}
