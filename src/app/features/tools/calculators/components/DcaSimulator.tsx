'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Field, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { pointDot } from '@/lib/chart-dots'

import type { AssetOption, HistoryResult } from '../api/history'
import { lastYears, type MonthlyPoint } from '../math'
import { compareDcaLump, dcaWinRate } from '../strategies'
import { AmountField, ShareResultButton, Stat, useMoney } from './fields'
import { LessonCard, ResultHeadline, TermHelp } from './lesson'

const PERIODS = [1, 3, 5, 10, 15] as const
const GROUP_LABEL = { index: 'Stock market indices', fund: 'Funds (ETFs)', stock: 'Stocks' } as const

const config = {
  dca: { label: 'Monthly (cost averaging)', color: 'var(--chart-1)' },
  lump: { label: 'All at once (lump sum)', color: 'var(--chart-3)' },
  invested: { label: 'Put in so far, monthly', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

/**
 * Dollar-cost averaging vs lump sum (Carlos, 2026-09-30): the same money into
 * a real index, fund or stock two ways -- a set amount every month, or all of
 * it on day one -- replayed on Papaldo's monthly prices. Also counts, over
 * every window of that length in the history, how often the lump sum won.
 */
export function DcaSimulator({ options, defaultAsset }: { options: AssetOption[]; defaultAsset: string }) {
  const money = useMoney()
  const selectId = useId()
  const [asset, setAsset] = useState(defaultAsset)
  const [monthlyUsd, setMonthlyUsd] = useState(100)
  const [years, setYears] = useState<(typeof PERIODS)[number]>(1)
  const [history, setHistory] = useState<HistoryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const cache = useRef(new Map<string, HistoryResult>())
  useTutorialDemo('dca.period', () => setYears(10))

  useEffect(() => {
    const cached = cache.current.get(asset)
    if (cached) {
      setHistory(cached)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/calculators/history?asset=${encodeURIComponent(asset)}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<HistoryResult>)
      .then((result) => {
        if (result.ok) cache.current.set(asset, result)
        setHistory(result)
      })
      .catch((error: unknown) => {
        if ((error as DOMException)?.name !== 'AbortError') setHistory({ ok: false, message: 'The price history could not be loaded. Try again.' })
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [asset])

  const points = useMemo<MonthlyPoint[]>(() => (history?.ok ? history.points : []), [history])
  // A 1-year window is 12 monthly buys: `lastYears` keeps one extra month for returns, not needed here.
  const span = useMemo(() => lastYears(points, years).slice(-years * 12), [points, years])
  const result = useMemo(() => compareDcaLump(span, monthlyUsd), [span, monthlyUsd])
  const wins = useMemo(() => dcaWinRate(points, years * 12), [points, years])
  const label = (history?.ok ? history.label : (options.find((o) => o.value === asset)?.label ?? asset)).split(' · ')[0]
  const lumpAhead = result ? result.lumpFinal >= result.dcaFinal : false
  const gap = result ? Math.abs(result.lumpFinal - result.dcaFinal) : 0

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5 md:grid-cols-2 lg:grid-cols-4">
          <Field className="md:col-span-2" data-tut="dca.asset">
            <div className="flex items-center gap-1">
              <FieldLabel htmlFor={selectId}>Invest in</FieldLabel>
              <TermHelp id="investment" />
            </div>
            <NativeSelect id={selectId} value={asset} onChange={(event) => setAsset(event.target.value)} className="h-10 w-full rounded-xl">
              {(['index', 'fund', 'stock'] as const).map((group) => (
                <NativeSelectOptGroup key={group} label={GROUP_LABEL[group]}>
                  {options
                    .filter((option) => option.group === group)
                    .map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                </NativeSelectOptGroup>
              ))}
            </NativeSelect>
          </Field>
          <div data-tut="dca.amount">
            <AmountField label="Every month" usd={monthlyUsd} onChange={setMonthlyUsd} help="monthlyAmount" />
          </div>
          <Field data-tut="dca.period">
            <div className="flex items-center gap-1">
              <FieldLabel>Over the last</FieldLabel>
              <TermHelp id="period" />
            </div>
            <ToggleGroup
              variant="outline"
              spacing={0}
              className="w-full"
              value={[String(years)]}
              onValueChange={(value) => value[0] && setYears(Number(value[0]) as (typeof PERIODS)[number])}
            >
              {PERIODS.map((option) => (
                <ToggleGroupItem key={option} value={String(option)} className="h-10 flex-1 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                  {option}Y
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5">
          {loading && !result ? (
            <div className="grid gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-[220px] sm:h-[260px] rounded-xl" />
            </div>
          ) : history && !history.ok ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{history.message}</p>
          ) : result ? (
            <>
              {/* Plain words first (Carlos, 2026-10-01): who put in what, when, two ways. */}
              <ResultHeadline
                data-tut="dca.result"
                lead={
                  <>
                    You put <span className="figure font-medium text-foreground">{money.format(result.total)}</span> into {label} between{' '}
                    {monthLabel.format(asDate(result.rows[0].date))} and {monthLabel.format(asDate(result.rows[result.rows.length - 1].date))}:{' '}
                    {money.format(monthlyUsd)} every month, or all of it on day one.
                  </>
                }
                verdict={
                  <>
                    {lumpAhead ? 'All at once' : 'Monthly'} ended <span className="figure text-primary">{money.format(gap)}</span> ahead
                  </>
                }
              />
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <Stat label="Monthly" value={money.compact(result.dcaFinal)} tone={lumpAhead ? undefined : 'gain'} />
                <Stat label="All at once" value={money.compact(result.lumpFinal)} tone={lumpAhead ? 'gain' : undefined} />
                <Stat label="Avg price paid, monthly" value={money.format(result.dcaAvgPrice)} />
                <Stat label="Price paid, all at once" value={money.format(result.lumpPrice)} />
              </div>

              <ChartContainer config={config} className="aspect-auto h-[220px] sm:h-[260px] w-full" data-tut="dca.chart">
                <LineChart data={result.rows} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                    tickFormatter={(iso: string) => (years <= 1 ? monthLabel.format(asDate(iso)) : asDate(iso).getUTCFullYear().toString())}
                  />
                  <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => money.compact(value)} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          const iso = payload?.[0]?.payload?.date as string | undefined
                          return iso ? monthLabel.format(asDate(iso)) : ''
                        }}
                        formatter={(value, name) => (
                          <span className="flex w-full justify-between gap-3">
                            <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                            <span className="figure font-medium">{money.format(Number(value))}</span>
                          </span>
                        )}
                      />
                    }
                  />
                  <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
                  <Line dataKey="lump" type="monotone" stroke="var(--color-lump)" strokeWidth={2} dot={pointDot(result.rows.length, 'var(--color-lump)')} isAnimationActive={false} />
                  <Line dataKey="dca" type="monotone" stroke="var(--color-dca)" strokeWidth={2.25} dot={pointDot(result.rows.length, 'var(--color-dca)')} isAnimationActive={false} />
                  <Line dataKey="invested" type="stepAfter" stroke="var(--color-invested)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                </LineChart>
              </ChartContainer>

              <LessonCard data-tut="dca.history" terms={['dca', 'lumpSum']}>
                Markets rise more often than they fall, so money invested sooner usually ends ahead
                {wins.windows > 1 ? (
                  <>
                    {' '}
                    — in {label} it did in <span className="figure font-medium">{Math.round((wins.lumpWins / wins.windows) * 100)}%</span> of past{' '}
                    {years}-year periods
                  </>
                ) : null}
                . Investing monthly wins when prices drop first, and it is how most people invest from a salary.{' '}
                <span className="font-semibold">Starting matters more than timing.</span>
              </LessonCard>

              <ShareResultButton
                filename={`papaldo-dca-${asset.toLowerCase()}`}
                build={() => ({
                  eyebrow: 'PAPALDO KA · DCA VS LUMP SUM',
                  title: `${lumpAhead ? 'Lump sum' : 'Monthly buying'} won by ${money.compact(gap)} in ${label}`,
                  subtitle: `${money.format(monthlyUsd)} a month vs ${money.format(result.total)} at once, over ${years} ${years === 1 ? 'year' : 'years'}`,
                  stats: [
                    { label: 'Every month', value: money.compact(result.dcaFinal) },
                    { label: 'All at once', value: money.compact(result.lumpFinal) },
                    { label: 'Put in', value: money.compact(result.total) },
                    { label: 'Lump sum won', value: wins.windows > 1 ? `${Math.round((wins.lumpWins / wins.windows) * 100)}% of periods` : '—' },
                  ],
                  buysLabel: '',
                  buys: [],
                  chart: [
                    { label: 'Every month', values: result.rows.map((r) => r.dca) },
                    { label: 'All at once', values: result.rows.map((r) => r.lump), dashed: true },
                  ],
                  footer: 'Papaldo Ka · real monthly prices, dividends not included · past performance, not financial advice',
                })}
              />
              <p className="text-xs text-muted-foreground">
                Real monthly closing prices, split-adjusted, without dividends or fees. Past results say nothing certain about the future.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
