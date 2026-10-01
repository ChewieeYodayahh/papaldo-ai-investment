'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFx } from '@/app/features/userData/preferences/components/Money'
import { pointDot } from '@/lib/chart-dots'
import { cn } from '@/lib/utils'

import { effectiveAnnualRate, savingsGoal, type Frequency } from '../math'
import { whatItBuys } from '../purchases'
import { EmergencyFundFields, useEmergencyFund } from './EmergencyFundPlanner'
import { AmountField, NumberField, ShareResultButton, Stat, useMoney, WhatItBuys } from './fields'
import { LessonCard, TermHelp } from './lesson'

const FREQUENCIES: Array<{ value: Frequency; label: string; per: string }> = [
  { value: 'weekly', label: 'Weekly', per: 'a week' },
  { value: 'biweekly', label: 'Every 2 weeks', per: 'every two weeks' },
  { value: 'monthly', label: 'Monthly', per: 'a month' },
]

export type RatePreset = { label: string; ratePct: number }

/**
 * Savings & Investment Goal calculator (Carlos, 2026-09-29): how much to put
 * away each week, fortnight or month to reach a target, using the sinking-fund
 * formula. Standalone on /tools/savings and in a dialog under the index
 * benchmarker, where `presets` offer each index's real historical CAGR as the
 * expected return.
 *
 * With `emergencyFund` (the savings page, 2026-10-01) a checkbox adds an
 * emergency fund in a Philippine bank deposit to the same chart, over the
 * same years: one chart, the goal and the safety net side by side.
 */
export function SavingsGoalCalculator({
  presets = [],
  initialRatePct = 7,
  emergencyFund = false,
  className,
}: {
  presets?: RatePreset[]
  initialRatePct?: number
  emergencyFund?: boolean
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
  const [withFund, setWithFund] = useState(emergencyFund)
  const fund = useEmergencyFund(years)
  const showFund = emergencyFund && withFund

  const result = useMemo(
    () => savingsGoal({ target: targetUsd, years, annualRatePct: ratePct, frequency, initial: startUsd }),
    [targetUsd, years, ratePct, frequency, startUsd],
  )
  const per = FREQUENCIES.find((f) => f.value === frequency)?.per ?? ''
  const growthShare = result.finalBalance > 0 ? (result.totalGrowth / result.finalBalance) * 100 : 0
  const rows = result.schedule.map((row) => ({
    year: row.year,
    balance: row.balance,
    contributed: row.contributed,
    ...(showFund ? { fund: fund.balanceAt(row.year) } : {}),
  }))
  const config = {
    balance: { label: 'Investing for the goal', color: 'var(--chart-1)' },
    contributed: { label: 'Your deposits', color: 'var(--muted-foreground)' },
    fund: { label: `Emergency fund, ${fund.product.bank}${fund.taxed ? ' (after tax)' : ''}`, color: 'var(--chart-2)' },
  } satisfies ChartConfig

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]', className)}>
      <Card className="rounded-2xl border-0 py-4 sm:py-5" data-tut="savings.goal">
        <CardHeader className="px-4 sm:px-5">
          <CardTitle className="text-base font-semibold">Your goal</CardTitle>
          <CardDescription>The amount, the deadline and the return you expect.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 sm:px-5">
          <AmountField label="Target amount" usd={targetUsd} onChange={setTargetUsd} help="goal" />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Years" value={years} onChange={setYears} min={1} max={50} suffix="yrs" />
            <NumberField label="Expected return" value={ratePct} onChange={setRatePct} min={0} max={30} step={0.5} suffix="% / yr" help="expectedReturn" />
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

          {emergencyFund ? (
            <div className="grid gap-4 border-t pt-4">
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <Checkbox checked={withFund} onCheckedChange={(checked) => setWithFund(checked === true)} />
                Include an emergency fund
                <TermHelp id="emergencyFund" />
              </label>
              {withFund ? <EmergencyFundFields fund={fund} /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5">
          <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/25" data-tut="savings.result">
            <p className="text-sm text-muted-foreground">
              {result.coveredByStart
                ? `What you have already reaches ${money.format(targetUsd)}`
                : `To reach ${money.format(targetUsd)} in ${years} ${years === 1 ? 'year' : 'years'}, save ${per}`}
            </p>
            <p className="figure text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {result.coveredByStart ? money.format(0) : money.format(result.payment)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.periods.toLocaleString('en-US')} deposits at {ratePct}% a year (effectively{' '}
              {effectiveAnnualRate(ratePct, frequency === 'monthly' ? 12 : frequency === 'weekly' ? 52 : 26).toFixed(2)}% once
              compounded).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Your deposits" value={money.compact(result.totalContributions)} />
            <Stat label="Growth" value={money.compact(result.totalGrowth)} tone="gain" />
            <Stat label="Growth share" value={`${growthShare.toFixed(0)}%`} />
          </div>

          <ChartContainer config={config} className="aspect-auto h-[220px] w-full sm:h-[260px]" data-tut="savings.compare">
            <LineChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
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
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
              <ReferenceLine y={targetUsd} stroke="var(--color-balance)" strokeOpacity={0.5} strokeDasharray="2 4" label={{ value: 'Goal', position: 'insideTopLeft', fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <Line dataKey="balance" type="monotone" stroke="var(--color-balance)" strokeWidth={2.5} dot={pointDot(rows.length, 'var(--color-balance)')} isAnimationActive={false} />
              <Line dataKey="contributed" type="stepAfter" stroke="var(--color-contributed)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
              {showFund ? (
                <Line dataKey="fund" type="monotone" stroke="var(--color-fund)" strokeWidth={2} dot={pointDot(rows.length, 'var(--color-fund)')} isAnimationActive={false} />
              ) : null}
            </LineChart>
          </ChartContainer>
          {showFund ? (
            <p className="-mt-2 text-sm text-muted-foreground">
              Your {money.compact(fund.amountUsd)} emergency fund in {fund.product.bank} earns{' '}
              <span className="figure font-medium text-gain">{money.format(fund.interest)}</span> in {years}{' '}
              {years === 1 ? 'year' : 'years'}
              {fund.taxed ? ' after tax' : ''}, and stays ready to use.
            </p>
          ) : null}

          <LessonCard terms={showFund ? ['emergencyFund', 'timeDeposit', 'withholdingTax', 'pdic'] : ['compound', 'emergencyFund']}>
            Keep three to six months of expenses somewhere safe and easy to reach first, then invest for the goal. A
            deposit is steady; investing grows faster but moves.
          </LessonCard>

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
                showFund
                  ? { label: `Emergency fund, ${fund.product.bank}`, value: money.compact(fund.balanceAt(years)) }
                  : { label: 'Goal', value: money.compact(targetUsd) },
              ],
              buysLabel: 'That goal could buy',
              buys: whatItBuys(targetUsd, fx?.rate ?? null).map((p) => p.text),
              chart: [
                { label: 'Investing for the goal', values: rows.map((row) => row.balance) },
                { label: 'Your deposits', values: rows.map((row) => row.contributed), dashed: true },
                ...(showFund ? [{ label: 'Emergency fund', values: rows.map((row) => row.fund ?? null) }] : []),
              ],
              footer: 'Papaldo Ka · a planning estimate, not a promise or financial advice',
            })}
          />
          <p className="text-xs text-muted-foreground">
            A planning estimate. Real returns go up and down; this assumes a steady rate every year.
            {showFund
              ? ` The deposit renews at the same rate every term.${fund.product.kind === 'time-deposit' ? ' Breaking a time deposit early usually costs part of the interest.' : ''}`
              : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
