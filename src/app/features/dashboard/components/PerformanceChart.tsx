'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Change } from '@/app/features/markets/components/Change'
import { PILL_LIST, PILL_TRIGGER } from '@/app/features/markets/components/pill-tabs'
import { useMoneyFormat } from '@/app/features/preferences/components/Money'
import { useCopy } from '@/app/features/preferences/copy'
import { pointDot } from '@/lib/chart-dots'

import type { Point } from '../portfolio-math'

/**
 * No 1D range: the history is rebuilt from daily closes, so a one-day window
 * would be two points pretending to be an intraday chart.
 */
const RANGES = [
  { id: '7D', days: 7 },
  { id: '1M', days: 30 },
  { id: '6M', days: 182 },
  { id: '1Y', days: 365 },
  { id: 'MAX', days: Infinity },
] as const
type RangeId = (typeof RANGES)[number]['id']

const config = { value: { label: 'Account value', color: 'var(--chart-1)' } } satisfies ChartConfig

/**
 * Y range with headroom. Recharts' 'auto' fits the axis tight to the data, so
 * a 0.5% wobble fills the whole height and reads as a crash. Padding to at
 * least 2% of the value keeps small moves looking small.
 */
function paddedDomain(points: Point[]): [number, number] {
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max((max - min) * 0.15, max * 0.02)
  return [Math.max(0, min - pad), max + pad]
}

const dayLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export function PerformanceChart({ points }: { points: Point[] }) {
  const t = useCopy()
  const money = useMoneyFormat()
  const [range, setRange] = useState<RangeId>('1M')

  const visible = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? Infinity
    return Number.isFinite(days) ? points.slice(-(days + 1)) : points
  }, [points, range])

  const first = visible[0]?.value ?? 0
  const last = visible.at(-1)?.value ?? 0
  const change = first > 0 ? ((last - first) / first) * 100 : 0
  const long = visible.length > 120
  const format = (date: string) => (long ? monthLabel : dayLabel).format(new Date(`${date}T00:00:00Z`))

  return (
    <Card className="rounded-2xl border-0 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="text-base font-medium">
              {t('dash.performance')}{' '}
              {visible.length > 1 ? <Change percent={change} className="ml-1 text-sm" /> : null}
            </h2>
            <p className="text-xs text-muted-foreground">{t('dash.performanceNote')}</p>
          </div>
          <Tabs value={range} onValueChange={(value) => setRange(value as RangeId)}>
            <TabsList className={PILL_LIST}>
              {RANGES.map((r) => (
                <TabsTrigger key={r.id} value={r.id} className={`${PILL_TRIGGER} min-w-10 text-xs`}>
                  {r.id}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {visible.length < 2 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Your history starts today. Check back tomorrow for the first line.
          </p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[200px] w-full lg:h-[220px]">
            <AreaChart data={visible} margin={{ left: 4, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="performance-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                tickMargin={8}
                tickFormatter={format}
              />
              <YAxis
                width={72}
                tickLine={false}
                axisLine={false}
                domain={paddedDomain(visible)}
                tickFormatter={(value: number) => money.compact(value)}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const date = payload?.[0]?.payload?.date as string | undefined
                      return date ? dayLabel.format(new Date(`${date}T00:00:00Z`)) : ''
                    }}
                    formatter={(value) => <span className="figure">{money.format(Number(value))}</span>}
                  />
                }
              />
              <Area
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={2.5}
                fill="url(#performance-fill)"
                dot={pointDot(visible.length, 'var(--color-value)')}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
