'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts'

import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { useFx } from '@/app/features/userData/preferences/components/Money'
import { pointDot } from '@/lib/chart-dots'

import type { AssetOption, HistoryResult } from '../api/history'
import { lastYears, projectFromCagr, replayHistory, type MonthlyPoint } from '../math'
import { whatItBuys } from '../purchases'
import { AmountField, NumberField, ShareResultButton, Stat, useMoney, WhatItBuys } from './fields'
import { LessonCard, TermHelp } from './lesson'
import { SavingsGoalDialog } from './SavingsGoalDialog'
import { T } from '@/app/features/userData/preferences/copy'

/** 10 or 15 years back (Carlos, 2026-09-30), or everything Papaldo has. */
export const YEAR_OPTIONS = [10, 15, 'max'] as const
export type YearOption = (typeof YEAR_OPTIONS)[number]

const GROUP_LABEL = { index: 'Stock market indices', fund: 'Funds (ETFs)', stock: 'Stocks' } as const

const config = {
  value: { label: 'Worth', color: 'var(--chart-1)' },
  projected: { label: 'Projected', color: 'var(--chart-3)' },
  contributed: { label: 'You put in', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

type ChartRow = { date: string; value?: number; projected?: number; contributed: number }

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

/**
 * Historical returns calculator (Carlos, 2026-09-29), the standalone tool on
 * /tools/returns. Pick any index, fund or stock Papaldo tracks, an amount to
 * start with and a monthly top-up, and it replays the asset's real monthly
 * prices: what that would be worth today, how much of it was growth, and
 * what that money buys. "How much should I save?" opens the goal calculator
 * with this asset's growth rate filled in.
 */
export function ReturnsCalculator({ options, defaultAsset }: { options: AssetOption[]; defaultAsset: string }) {
  const money = useMoney()
  const fx = useFx()
  const selectId = useId()
  const [asset, setAsset] = useState(defaultAsset)
  const [initialUsd, setInitialUsd] = useState(1_000)
  const [monthlyUsd, setMonthlyUsd] = useState(100)
  const [years, setYears] = useState<YearOption>(10)
  const [aheadYears, setAheadYears] = useState(5)
  const [history, setHistory] = useState<HistoryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveOpen, setSaveOpen] = useState(false)
  const cache = useRef(new Map<string, HistoryResult>())
  useTutorialDemo('returns.amounts', () => {
    setInitialUsd(1_000)
    setMonthlyUsd(200)
  })
  useTutorialDemo('returns.ahead', () => setAheadYears(10))

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
        if ((error as DOMException)?.name !== 'AbortError') {
          setHistory({ ok: false, message: 'The price history could not be loaded. Check your connection and try again.' })
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [asset])

  const points = useMemo<MonthlyPoint[]>(() => (history?.ok ? history.points : []), [history])
  const span = useMemo(() => lastYears(points, years), [points, years])
  const result = useMemo(() => replayHistory(span, initialUsd, monthlyUsd), [span, initialUsd, monthlyUsd])
  const label = history?.ok ? history.label : (options.find((o) => o.value === asset)?.label ?? asset)
  const shortLabel = label.split(' · ')[0]
  const since = span[0]?.date
  const shorterThanAsked = typeof years === 'number' && result !== null && result.years < years - 0.1

  // The "Projected" line: the replay carried forward at the asset's own CAGR.
  const projection = useMemo(() => {
    if (!result || result.cagrPct === null || aheadYears <= 0) return []
    return projectFromCagr(result.rows[result.rows.length - 1], result.cagrPct, monthlyUsd, aheadYears)
  }, [result, monthlyUsd, aheadYears])
  const chartRows = useMemo<ChartRow[]>(() => {
    if (!result) return []
    const real: ChartRow[] = result.rows.map((row) => ({ date: row.date, value: row.value, contributed: row.contributed }))
    if (projection.length === 0) return real
    // The last real month carries both keys so the dashed line starts where the real one ends.
    real[real.length - 1].projected = projection[0].value
    return [...real, ...projection.slice(1).map((row) => ({ date: row.date, projected: row.value, contributed: row.contributed }))]
  }, [result, projection])
  const projectedEnd = projection.at(-1)

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5 md:grid-cols-2 lg:grid-cols-4">
          <Field className="md:col-span-2" data-tut="returns.asset">
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
          <div data-tut="returns.amounts" className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            <AmountField label="Start with" usd={initialUsd} onChange={setInitialUsd} />
            <AmountField label="Add every month" usd={monthlyUsd} onChange={setMonthlyUsd} help="monthlyAmount" />
          </div>
          <Field className="md:col-span-2 lg:col-span-3" data-tut="returns.window">
            <div className="flex items-center gap-1">
              <FieldLabel>Starting</FieldLabel>
              <TermHelp id="period" />
            </div>
            <ToggleGroup
              variant="outline"
              spacing={2}
              value={[String(years)]}
              onValueChange={(value) => value[0] && setYears(value[0] === 'max' ? 'max' : (Number(value[0]) as YearOption))}
            >
              {YEAR_OPTIONS.map((option) => (
                <ToggleGroupItem key={option} value={String(option)} className="h-9 min-w-16 aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                  {option === 'max' ? 'All history' : `${option} years ago`}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <div data-tut="returns.ahead">
            <NumberField
              label="Project ahead"
              help="projection"
              value={aheadYears}
              onChange={setAheadYears}
              min={0}
              max={30}
              suffix="yrs"
              hint="At the asset’s own yearly growth. 0 hides it."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5">
          {loading && !result ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-[240px] rounded-xl" />
            </div>
          ) : history && !history.ok ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{history.message}</p>
          ) : result ? (
            <>
              <div data-tut="returns.result">
                <p className="text-sm text-muted-foreground">
                  You put {money.format(initialUsd)} into {shortLabel} in {since ? monthLabel.format(asDate(since)) : '—'}
                  {monthlyUsd > 0 ? `, plus ${money.format(monthlyUsd)} every month` : ''}. Today it would be worth
                </p>
                <p className="figure text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{money.format(result.finalValue)}</p>
                {shorterThanAsked ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Papaldo has {result.years.toFixed(1)} years of prices for {shortLabel}, so this starts at the earliest month available.
                    {options.find((o) => o.value === asset)?.group === 'index'
                      ? ''
                      : ' Stock and fund prices come from Alpaca, whose history is shorter than the indices’.'}
                  </p>
                ) : null}
                {projectedEnd && result.cagrPct !== null ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kept going at its {result.cagrPct.toFixed(1)}% a year, it could reach{' '}
                    <span className="figure font-medium text-foreground">{money.format(projectedEnd.value)}</span> in {aheadYears} more{' '}
                    {aheadYears === 1 ? 'year' : 'years'} (a projection, not a promise).
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <Stat label="You put in" value={money.compact(result.contributed)} />
                <Stat label="Growth" value={money.compact(result.growth)} tone={result.growth >= 0 ? 'gain' : 'loss'} />
                <Stat
                  label="Times your money"
                  value={result.contributed > 0 ? `${(result.finalValue / result.contributed).toFixed(2)}×` : '—'}
                />
                <Stat label="Avg yearly growth" value={result.cagrPct === null ? '—' : `${result.cagrPct.toFixed(1)}%`} tone="accent" />
              </div>

              <ChartContainer config={config} className="aspect-auto h-[240px] w-full" data-tut="returns.chart">
                <AreaChart data={chartRows} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="returns-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                    tickFormatter={(iso: string) => asDate(iso).getUTCFullYear().toString()}
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
                  <Area
                    dataKey="value"
                    type="monotone"
                    stroke="var(--color-value)"
                    strokeWidth={2.25}
                    fill="url(#returns-fill)"
                    dot={pointDot(chartRows.length, 'var(--color-value)')}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="projected"
                    type="monotone"
                    stroke="var(--color-projected)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={pointDot(chartRows.length, 'var(--color-projected)')}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="contributed"
                    type="stepAfter"
                    stroke="var(--color-contributed)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>

              <LessonCard data-tut="returns.lesson" terms={result.growth >= 0 ? ['indexFund', 'cagr', 'projection'] : ['diversification', 'indexFund']}>
                {result.growth >= 0
                  ? 'The dips along the way recovered, and staying invested did most of the work. A projection only carries the past trend forward: it is a guide, not a promise.'
                  : 'This one lost money over the period. A single company can fall and stay down; spreading money across a whole index lowers that risk.'}
              </LessonCard>

              <WhatItBuys amountUsd={result.finalValue} label="That’s enough for" />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" data-tut="returns.share">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Checkbox checked={saveOpen} onCheckedChange={(checked) => setSaveOpen(Boolean(checked))} />
                  <T k="calc.howMuchSave" />
                </label>
                <ShareResultButton
                  filename={`papaldo-returns-${asset.toLowerCase()}`}
                  build={() => ({
                    eyebrow: 'PAPALDO KA · RETURNS CALCULATOR',
                    title: `${money.compact(result.contributed)} in ${shortLabel} would be ${money.compact(result.finalValue)} today`,
                    subtitle: `${money.format(initialUsd)} to start${monthlyUsd > 0 ? `, ${money.format(monthlyUsd)} a month` : ''}, since ${since ? monthLabel.format(asDate(since)) : ''}`,
                    stats: [
                      { label: 'Worth today', value: money.compact(result.finalValue) },
                      { label: 'I put in', value: money.compact(result.contributed) },
                      { label: 'Growth', value: money.compact(result.growth) },
                      { label: 'Yearly growth', value: result.cagrPct === null ? '—' : `${result.cagrPct.toFixed(1)}%` },
                    ],
                    buysLabel: 'That’s enough for',
                    buys: whatItBuys(result.finalValue, fx?.rate ?? null).map((p) => p.text),
                    chart: [
                      { label: 'Worth', values: chartRows.map((row) => row.value ?? null) },
                      ...(projection.length ? [{ label: 'Projected', values: chartRows.map((row) => row.projected ?? null), dashed: true }] : []),
                    ],
                    footer: 'Papaldo Ka · real monthly prices, dividends not included · past performance, not financial advice',
                  })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Uses real monthly closing prices, split-adjusted, without dividends. Past performance says nothing certain about the future.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <SavingsGoalDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        presets={result?.cagrPct != null ? [{ label: shortLabel, ratePct: result.cagrPct }] : []}
        initialRatePct={result?.cagrPct != null ? Math.max(0, result.cagrPct) : 7}
      />
    </div>
  )
}
