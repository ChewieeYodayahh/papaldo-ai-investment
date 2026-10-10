'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { IncomeCurrency } from '@/app/features/auth/schema'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { useDisplayCurrency, useFx } from '@/app/features/userData/preferences/components/Money'
import { pointDot } from '@/lib/chart-dots'
import { cn } from '@/lib/utils'

import { monthlySavingNeeded, retirementPlan } from '../strategies'
import { AmountField, NumberField, ShareResultButton, useMoney } from './fields'
import { LessonCard, ResultHeadline } from './lesson'
import { T } from '@/app/features/userData/preferences/copy'

const DELAYS = [0, 5, 10, 15] as const
/** The chart stops this many years before retirement, where the monthly figure shoots up. */
const LAST_YEARS = 5
/** About ₱30,000 a month. */
const DEFAULT_INCOME_USD = 500

const config = {
  monthly: { label: 'Saving needed a month', color: 'var(--chart-1)' },
} satisfies ChartConfig

/**
 * The cost of waiting (Carlos, 2026-10-01): tell it the income you want in
 * retirement, and it shows what you would have to save every month to get
 * there -- starting now, or 5, 10 or 15 years from now. The target is the 4%
 * rule (25 years of that income), grown by inflation to the day you retire.
 *
 * `profileIncome` is the signed-in user's retirement income (a yearly figure,
 * in the currency it was entered in); it fills the field until they type.
 * `inflation` is each country's average over the last 20 years of CPI.
 */
export function CostOfWaiting({
  profileIncome,
  inflation,
}: {
  profileIncome: { amount: number; currency: IncomeCurrency } | null
  inflation: { PHP: number; USD: number }
}) {
  const money = useMoney()
  const fx = useFx()
  const { currency } = useDisplayCurrency()
  const [age, setAge] = useState(22)
  const [retireAge, setRetireAge] = useState(60)
  const [incomeUsd, setIncomeUsd] = useState<number | null>(null)
  const [ratePct, setRatePct] = useState(7)
  const [inflationPct, setInflationPct] = useState<number | null>(null)
  useTutorialDemo('waiting.inputs', () => {
    setAge(25)
    setRetireAge(65)
    setIncomeUsd(800)
  })

  // The profile figure is yearly and in its own currency; the field is monthly, in dollars underneath.
  const fromProfile =
    profileIncome && (profileIncome.currency === 'USD' || fx)
      ? profileIncome.amount / 12 / (profileIncome.currency === 'PHP' && fx ? fx.rate : 1)
      : null
  const monthlyIncome = incomeUsd ?? fromProfile ?? DEFAULT_INCOME_USD
  const inflationRate = inflationPct ?? Math.round(inflation[currency] * 10) / 10

  const retire = Math.max(retireAge, age + 1)
  const plan = useMemo(
    () => retirementPlan({ age, retireAge: retire, monthlyIncome, ratePct, inflationPct: inflationRate, delays: [...DELAYS] }),
    [age, retire, monthlyIncome, ratePct, inflationRate],
  )
  const rows = useMemo(() => {
    const last = Math.max(age, retire - LAST_YEARS)
    return Array.from({ length: last - age + 1 }, (_, i) => ({
      startAge: age + i,
      monthly: monthlySavingNeeded(plan.target, (retire - age - i) * 12, ratePct) ?? 0,
    }))
  }, [age, retire, plan.target, ratePct])

  const [now, , tenLater] = plan.starts
  const ratio = now.monthly && tenLater.monthly ? tenLater.monthly / now.monthly : null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardHeader className="px-4 sm:px-5">
          <CardTitle className="text-base font-semibold"><T k="calc.yourRetirement" /></CardTitle>
          <CardDescription>When you want to stop working, and what you want to live on.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 sm:px-5" data-tut="waiting.inputs">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Your age" value={age} onChange={setAge} min={15} max={80} suffix="yrs" help="age" />
            <NumberField label="Retire at" value={retireAge} onChange={setRetireAge} min={30} max={90} suffix="yrs" help="retireAge" />
          </div>
          <AmountField
            label="Retirement income, a month"
            usd={monthlyIncome}
            onChange={setIncomeUsd}
            help="retirementIncome"
            hint={incomeUsd === null && fromProfile !== null ? 'From your profile. Change it here to try another amount.' : 'In today’s money.'}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Expected return" value={ratePct} onChange={setRatePct} min={0} max={20} step={0.5} suffix="%" help="expectedReturn" />
            <NumberField label="Inflation" value={inflationRate} onChange={setInflationPct} min={0} max={20} step={0.1} suffix="%" help="inflation" />
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            {currency === 'PHP' ? 'Philippine' : 'US'} prices rose {inflation[currency].toFixed(1)}% a year on average over the last 20 years.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5">
          <ResultHeadline
            lead={
              <>
                To retire at {retire} on <span className="figure font-medium text-foreground">{money.format(monthlyIncome)}</span> a month in
                today’s money ({money.compact(plan.incomeAtRetirement)} by then), you need about{' '}
                <span className="figure font-medium text-foreground">{money.compact(plan.target)}</span> saved.
              </>
            }
            verdict={
              ratio ? (
                <>
                  Waiting 10 years means saving <span className="figure text-loss">{ratio.toFixed(1)}×</span> as much every month
                </>
              ) : (
                'Start as early as you can: every year counts'
              )
            }
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-tut="waiting.results">
            {plan.starts.map((start, i) => (
              <div key={start.delay} className={cn('rounded-xl p-2.5 sm:p-3', i === 0 ? 'bg-primary/10 ring-1 ring-primary/25' : 'bg-muted/50')}>
                <p className="text-xs text-muted-foreground">{i === 0 ? `Start now (${start.startAge})` : `Start at ${start.startAge}`}</p>
                <p className={cn('figure text-base font-semibold sm:text-lg', i === 0 && 'text-primary')}>
                  {start.monthly === null ? '—' : `${money.compact(Math.round(start.monthly))}/mo`}
                </p>
                <p className="figure text-xs text-muted-foreground">
                  {start.monthly === null
                    ? 'too late to start'
                    : i === 0
                      ? `${money.compact(start.contributed ?? 0)} put in`
                      : `+${money.compact(Math.round(start.monthly - (now.monthly ?? 0)))} a month`}
                </p>
              </div>
            ))}
          </div>

          <ChartContainer config={config} className="aspect-auto h-[220px] w-full sm:h-[260px]" data-tut="waiting.chart">
            <LineChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="startAge" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => money.compact(value)} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => `Start at ${payload?.[0]?.payload?.startAge ?? ''}`}
                    formatter={(value) => (
                      <span className="flex w-full justify-between gap-3">
                        <span className="text-muted-foreground">Saving needed</span>
                        <span className="figure font-medium">{money.format(Number(value))} / month</span>
                      </span>
                    )}
                  />
                }
              />
              <Line dataKey="monthly" type="monotone" stroke="var(--color-monthly)" strokeWidth={2.5} dot={pointDot(rows.length, 'var(--color-monthly)')} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
          <p className="-mt-2 text-xs text-muted-foreground">Across: the age you start saving. Up: what each month has to be.</p>

          <LessonCard data-tut="waiting.lesson" terms={['compound', 'fourPercent', 'inflation']}>
            Money saved early has more years to grow, so it does more of the work. Every year you wait, each month has
            to carry more.
          </LessonCard>

          <ShareResultButton
            filename="papaldo-cost-of-waiting"
            build={() => ({
              eyebrow: 'PAPALDO KA · THE COST OF WAITING',
              title: ratio
                ? `Waiting 10 years means saving ${ratio.toFixed(1)}× as much every month`
                : `Retiring at ${retire} takes about ${money.compact(plan.target)} saved`,
              subtitle: `${money.format(monthlyIncome)} a month in retirement (today’s money), at ${ratePct}% a year`,
              stats: plan.starts.map((start, i) => ({
                label: i === 0 ? `Start now (${start.startAge})` : `Start at ${start.startAge}`,
                value: start.monthly === null ? '—' : `${money.compact(Math.round(start.monthly))}/mo`,
              })),
              buysLabel: '',
              buys: [],
              chart: [{ label: 'Saving needed a month, by starting age', values: rows.map((row) => row.monthly) }],
              footer: 'Papaldo Ka · a planning estimate at a steady return, not a promise or financial advice',
            })}
          />
          <p className="text-xs text-muted-foreground">
            A steady return every year, deposits at the end of each month, no fees or taxes. The target is 25 years of
            your income (the 4% rule). Real markets go up and down.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
