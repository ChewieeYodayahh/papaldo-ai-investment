'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Crown, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Change } from '@/app/features/markets/components/Change'
import { PILL_LIST, PILL_TRIGGER } from '@/app/features/markets/components/pill-tabs'
import { useCopy } from '@/app/features/preferences/copy'
import { cn } from '@/lib/utils'

import type { BenchmarksPayload, IndexMeta } from '../api/benchmarks'
import { lastMonths, rebase, summarize, type IndexKey, type IndexSummary } from '../math'

/** One chart token per index; no colour is defined in this file. */
const COLOR: Record<IndexKey, string> = {
  PSEI: 'var(--chart-1)',
  NYSE: 'var(--chart-2)',
  NASDAQ: 'var(--chart-4)',
  SP500: 'var(--chart-3)',
}

const RANGES = [
  { id: '5Y', months: 60 },
  { id: '10Y', months: 120 },
  { id: '15Y', months: Infinity },
] as const
type RangeId = (typeof RANGES)[number]['id']
type View = 'growth' | 'yoy'

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const yearLabel = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' })
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)
const pct = (value: number, digits = 1) => `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`

function displayLabel(index: IndexMeta): string {
  return index.isProxy ? `${index.label} (EPHE)` : index.label
}

/**
 * The benchmarker: four indices, one scale.
 *
 * Growth view: every line rebased to 100 on the first month of the chosen
 * range (5Y / 10Y / 15Y), so the chart and the cards answer "how much did
 * each grow over this stretch". YoY view: the stored rolling 12-month return,
 * which does not depend on the range's start -- the range only crops it.
 */
export function Benchmarker({ data }: { data: BenchmarksPayload }) {
  const t = useCopy()
  const [view, setView] = useState<View>('growth')
  const [range, setRange] = useState<RangeId>('15Y')

  const months = RANGES.find((r) => r.id === range)?.months ?? Infinity
  const growth = useMemo(() => rebase(lastMonths(data.growth, months)), [data.growth, months])
  const yoy = useMemo(() => lastMonths(data.yoy, months), [data.yoy, months])

  const summaries = useMemo(
    () =>
      data.indexes
        .map((index) => summarize(growth, yoy, index.key))
        .filter((s): s is IndexSummary => s !== null),
    [data.indexes, growth, yoy],
  )
  const leader = summaries.reduce<IndexSummary | null>((best, s) => (!best || s.last > best.last ? s : best), null)

  const config = Object.fromEntries(
    data.indexes.map((index) => [index.key, { label: displayLabel(index), color: COLOR[index.key] }]),
  ) satisfies ChartConfig

  const proxy = data.indexes.find((index) => index.isProxy)
  const spanYears = Math.round((growth.length - 1) / 12)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <p className="max-w-2xl text-[0.8125rem] text-muted-foreground">{t('bm.subtitle')}</p>
          {data.asOf ? (
            <p className="text-xs text-muted-foreground">
              {t('bm.asOf', { date: monthLabel.format(asDate(data.asOf)) })}
            </p>
          ) : null}
        </div>
        <Tabs value={view} onValueChange={(value) => setView(value as View)}>
          <TabsList className={PILL_LIST}>
            <TabsTrigger value="growth" className={PILL_TRIGGER}>
              {t('bm.growth')}
            </TabsTrigger>
            <TabsTrigger value="yoy" className={PILL_TRIGGER}>
              {t('bm.yoy')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={range} onValueChange={(value) => setRange(value as RangeId)}>
          <TabsList className={PILL_LIST}>
            {RANGES.map((r) => (
              <TabsTrigger key={r.id} value={r.id} className={cn(PILL_TRIGGER, 'min-w-11')}>
                {r.id}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Summary: 2x2 on a phone, four across from lg. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.indexes.map((index) => {
          const s = summaries.find((x) => x.key === index.key)
          if (!s) return null
          const isLeader = leader?.key === index.key && view === 'growth'
          return (
            <Card key={index.key} className={cn('rounded-2xl border-0 py-4', isLeader && 'ring-2 ring-primary/50')}>
              <CardContent className="space-y-2 px-4">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLOR[index.key] }} aria-hidden />
                  <span className="truncate text-sm font-medium">{displayLabel(index)}</span>
                  {isLeader ? (
                    <Badge className="ml-auto gap-1 rounded-full bg-primary/15 px-2 text-primary">
                      <Crown className="size-3" />
                      <span className="hidden sm:inline">{t('bm.leader')}</span>
                    </Badge>
                  ) : null}
                </div>

                {view === 'growth' ? (
                  <>
                    <div>
                      <p className="text-[0.6875rem] text-muted-foreground">{t('bm.total')}</p>
                      <Change percent={s.totalGainPct} className="text-xl font-semibold sm:text-2xl" />
                    </div>
                    <p className="figure text-xs text-muted-foreground">
                      {t('bm.cagr')} <span className="font-medium text-foreground">{pct(s.cagrPct)}</span> {t('bm.perYear')}
                    </p>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[0.6875rem] text-muted-foreground">{t('bm.latestYoy')}</p>
                      {s.latestYoyPct === null ? (
                        <span className="text-xl font-semibold text-muted-foreground">—</span>
                      ) : (
                        <Change percent={s.latestYoyPct} className="text-xl font-semibold sm:text-2xl" />
                      )}
                    </div>
                    <p className="figure text-xs text-muted-foreground">
                      {t('bm.volatility')}{' '}
                      <span className="font-medium text-foreground">{s.volatilityPct.toFixed(1)}%</span> {t('bm.perYear')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-2xl border-0 py-4">
        <CardContent className="space-y-3 px-3 sm:px-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <h2 className="text-base font-medium">
              {view === 'growth' ? t('bm.growth') : t('bm.yoy')}
              <span className="ml-2 text-xs font-normal text-muted-foreground">{spanYears}Y</span>
            </h2>
            <p className="text-xs text-muted-foreground">{view === 'growth' ? t('bm.growthNote') : t('bm.yoyNote')}</p>
          </div>

          <ChartContainer config={config} className="aspect-auto h-[280px] w-full sm:h-[360px]">
            <LineChart data={view === 'growth' ? growth : yoy} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={36}
                tickMargin={8}
                tickFormatter={(iso: string) => yearLabel.format(asDate(iso))}
              />
              <YAxis
                width={48}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => (view === 'growth' ? `${Math.round(value)}` : `${Math.round(value)}%`)}
              />
              <ReferenceLine y={view === 'growth' ? 100 : 0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <ChartTooltip
                cursor={{ strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const iso = payload?.[0]?.payload?.date as string | undefined
                      return iso ? monthLabel.format(asDate(iso)) : ''
                    }}
                    formatter={(value, name) => (
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">{config[name as IndexKey]?.label ?? name}</span>
                        <span className="figure font-medium">
                          {view === 'growth' ? Number(value).toFixed(1) : pct(Number(value))}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              {data.indexes.map((index) => (
                <Line
                  key={index.key}
                  dataKey={index.key}
                  type="monotone"
                  stroke={`var(--color-${index.key})`}
                  strokeWidth={index.key === 'PSEI' ? 2.75 : 2}
                  dot={false}
                  connectNulls
                  // Every view/range switch re-renders the lines; replaying a
                  // draw-in animation each time is noise (and it never starts
                  // in a background tab, where rAF is paused).
                  isAnimationActive={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ChartContainer>

          {/* The cards double as the legend on a phone; this row is for wide screens. */}
          <div className="hidden flex-wrap gap-x-5 gap-y-1 px-1 sm:flex">
            {data.indexes.map((index) => (
              <span key={index.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: COLOR[index.key] }} aria-hidden />
                {displayLabel(index)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {proxy ? (
        <p className="flex gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Free PSEi history is not published by Yahoo Finance, and Stooq&apos;s download is behind a browser
            check, so the PSEi line uses EPHE — the iShares MSCI Philippines ETF, priced in US dollars. It tracks
            Philippine large caps closely but includes peso moves. It switches to the real PSEi automatically once
            the pipeline can read Stooq.
          </span>
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Price indices, monthly closes, dividends not included. Past performance says nothing certain about the future.
      </p>
    </div>
  )
}
