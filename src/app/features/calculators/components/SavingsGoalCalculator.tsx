'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Field, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFx } from '@/app/features/preferences/components/Money'
import { cn } from '@/lib/utils'

import { effectiveAnnualRate, savingsGoal, type Frequency } from '../math'
import { whatItBuys } from '../purchases'
import { AmountField, NumberField, ShareResultButton, Stat, useMoney, WhatItBuys } from './fields'

const FREQUENCIES: Array<{ value: Frequency; label: string; per: string }> = [
  { value: 'weekly', label: 'Weekly', per: 'a week' },
  { value: 'biweekly', label: 'Every 2 weeks', per: 'every two weeks' },
  { value: 'monthly', label: 'Monthly', per: 'a month' },
]

const config = {
  contributed: { label: 'Your deposits', color: 'var(--chart-2)' },
  growth: { label: 'Growth', color: 'var(--chart-1)' },
} satisfies ChartConfig

export type RatePreset = { label: string; ratePct: number }

/**
 * Savings & Investment Goal calculator (Carlos, 2026-09-29): how much to put
 * away each week, fortnight or month to reach a target, using the sinking-fund
 * formula. Standalone on /tools/savings and in a dialog under the index
 * benchmarker, where `presets` offer each index's real historical CAGR as the
 * expected return.
 */
export function SavingsGoalCalculator({
  presets = [],
  initialRatePct = 7,
  className,
}: {
  presets?: RatePreset[]
  initialRatePct?: number
  className?: string
}) {
  const money = useMoney()
  const fx = useFx()
  // Defaults in USD: about ₱1M, 10 years.
  const [targetUsd, setTargetUsd] = useState(17_000)
  const [startUsd, setStartUsd] = useState(0)
  const [years, setYears] = useState(10)
  const [ratePct, setRatePct] = useState(Math.round(initialRatePct * 10) / 10)
  const [frequency, setFrequency] = useState<Frequency>('monthly')

  const result = useMemo(
    () => savingsGoal({ target: targetUsd, years, annualRatePct: ratePct, frequency, initial: startUsd }),
    [targetUsd, years, ratePct, frequency, startUsd],
  )
  const per = FREQUENCIES.find((f) => f.value === frequency)?.per ?? ''
  const growthShare = result.finalBalance > 0 ? (result.totalGrowth / result.finalBalance) * 100 : 0

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]', className)}>
      <Card className="rounded-2xl border-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base font-semibold">Your goal</CardTitle>
          <CardDescription>Tell it the amount, the deadline and the return you expect.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-5">
          <AmountField label="Target amount" usd={targetUsd} onChange={setTargetUsd} />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Years" value={years} onChange={setYears} min={1} max={50} suffix="yrs" />
            <NumberField
              label="Expected return"
              value={ratePct}
              onChange={setRatePct}
              min={0}
              max={30}
              step={0.5}
              suffix="% / yr"
            />
          </div>
          {presets.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRatePct(Math.round(preset.ratePct * 10) / 10)}
                  className="rounded-full px-2.5 py-1 text-xs ring-1 ring-foreground/15 transition-colors hover:bg-accent"
                >
                  {preset.label} <span className="figure text-muted-foreground">{preset.ratePct.toFixed(1)}%</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              About 7% is a common planning figure for a diversified index fund; 10% is the long-run US stock
              market average. Neither is guaranteed.
            </p>
          )}
          <Field>
            <FieldLabel>How often you save</FieldLabel>
            <ToggleGroup
              variant="outline"
              spacing={0}
              className="w-full"
              value={[frequency]}
              onValueChange={(value) => value[0] && setFrequency(value[0] as Frequency)}
            >
              {FREQUENCIES.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value} className="h-9 flex-1 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <AmountField label="Already saved (optional)" usd={startUsd} onChange={setStartUsd} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-5">
        <CardContent className="grid gap-4 px-5">
          <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/25">
            <p className="text-sm text-muted-foreground">
              {result.coveredByStart ? 'You don’t need to add anything' : `Put away ${per}`}
            </p>
            <p className="figure text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {result.coveredByStart ? money.format(0) : money.format(result.payment)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.periods.toLocaleString('en-US')} deposits to reach {money.format(targetUsd)} in {years}{' '}
              {years === 1 ? 'year' : 'years'} at {ratePct}% a year (effectively{' '}
              {effectiveAnnualRate(ratePct, frequency === 'monthly' ? 12 : frequency === 'weekly' ? 52 : 26).toFixed(2)}% once
              compounded).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Your deposits" value={money.compact(result.totalContributions)} />
            <Stat label="Growth" value={money.compact(result.totalGrowth)} tone="gain" />
            <Stat label="Growth share" value={`${growthShare.toFixed(0)}%`} />
          </div>

          <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
            <BarChart data={result.schedule.filter((row) => row.year > 0)} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tickFormatter={(year: number) => `Y${year}`} />
              <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => money.compact(value)} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => `Year ${payload?.[0]?.payload?.year ?? ''}`}
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-3">
                        <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                        <span className="figure font-medium">{money.format(Number(value))}</span>
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="contributed" stackId="total" fill="var(--color-contributed)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="growth" stackId="total" fill="var(--color-growth)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <WhatItBuys amountUsd={targetUsd} label="Your goal could buy" />

          <ShareResultButton
            filename="papaldo-savings-goal"
            build={() => ({
              eyebrow: 'PAPALDO KA · SAVINGS GOAL',
              title: `${money.format(result.payment)} ${per} gets me to ${money.compact(targetUsd)} in ${years} years`,
              subtitle: `At ${ratePct}% a year, deposits made ${per}`,
              stats: [
                { label: 'Each deposit', value: money.format(result.payment) },
                { label: 'I put in', value: money.compact(result.totalContributions) },
                { label: 'Growth', value: money.compact(result.totalGrowth) },
                { label: 'Goal', value: money.compact(targetUsd) },
              ],
              buysLabel: 'That goal could buy',
              buys: whatItBuys(targetUsd, fx?.rate ?? null).map((p) => p.text),
              footer: 'Papaldo Ka · a planning estimate, not a promise or financial advice',
            })}
          />
          <p className="text-xs text-muted-foreground">
            A planning estimate. Real returns go up and down; this assumes a steady rate every year.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
