'use client'

import { useId, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { useFx } from '@/app/features/userData/preferences/components/Money'
import { usePreferences } from '@/app/features/userData/preferences/store'
import { pointDot } from '@/lib/chart-dots'

import type { CpiData } from '../api/cpi'
import { averageInflation, buyingPower, cpiAt, equivalent, projectBuyingPower } from '../inflation'
import { NumberField, NumberInput, ShareResultButton, Stat } from './fields'
import { LessonCard, TermHelp } from './lesson'
import { T } from '@/app/features/userData/preferences/copy'

type Currency = 'PHP' | 'USD'
const SERIES_FOR: Record<Currency, keyof CpiData> = { PHP: 'PHL', USD: 'USA' }
const COUNTRY: Record<Currency, string> = { PHP: 'Philippine', USD: 'US' }

// This tool works in one currency's own history, so amounts are shown in the
// currency picked, never converted (like self-reported incomes). The pick is
// the page's $ / ₱ switch (2026-10-01), which also chooses whose prices.
const FORMAT: Record<Currency, Intl.NumberFormat> = {
  PHP: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
}
const COMPACT: Record<Currency, Intl.NumberFormat> = {
  PHP: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', notation: 'compact', maximumFractionDigits: 1 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }),
}

const config = {
  value: { label: 'Buying power', color: 'var(--chart-1)' },
  projected: { label: 'Projected', color: 'var(--chart-3)' },
} satisfies ChartConfig

type Row = { year: number; value?: number; projected?: number }

/**
 * Purchasing Power calculator (Carlos, 2026-09-30): what money from one year
 * is worth in another, from the World Bank's consumer price index for the
 * Philippines or the US (1960 to the latest year published), and how fast
 * cash loses buying power -- with a projection at an editable inflation rate.
 */
export function PurchasingPowerCalculator({ cpi, portfolioUsd }: { cpi: CpiData; portfolioUsd: number | null }) {
  const fx = useFx()
  const amountId = useId()
  const fromId = useId()
  const toId = useId()
  const currency: Currency = usePreferences((s) => s.currency) === 'PHP' ? 'PHP' : 'USD'
  const series = cpi[SERIES_FOR[currency]]
  const firstYear = series[0]?.year ?? 1960
  const lastYear = series.at(-1)?.year ?? firstYear
  const [amount, setAmount] = useState(1_000)
  const [fromYear, setFromYear] = useState(2000)
  const [toYear, setToYear] = useState(lastYear)
  // Which currency the portfolio balance was filled in for: switching clears it.
  const [portfolioIn, setPortfolioIn] = useState<Currency | null>(null)
  const usedPortfolio = portfolioIn === currency

  // Keep the years inside what this currency's series has.
  const from = Math.min(Math.max(fromYear, firstYear), lastYear)
  const to = Math.min(Math.max(toYear, from), lastYear)
  const cpiFrom = cpiAt(series, from)
  const cpiTo = cpiAt(series, to)
  const longRun = cpiAt(series, firstYear) && cpiAt(series, lastYear)
    ? averageInflation(cpiAt(series, firstYear)!, cpiAt(series, lastYear)!, lastYear - firstYear)
    : 0
  const [inflationPct, setInflationPct] = useState<number | null>(null)
  const projectionRate = inflationPct ?? Math.round(longRun * 10) / 10
  const [aheadYears, setAheadYears] = useState(10)

  useTutorialDemo('purchasing.years', () => {
    setAmount(1_000)
    setFromYear(1990)
    setToYear(lastYear)
  })

  const history = useMemo(() => buyingPower(amount, series, from, to), [amount, series, from, to])
  const rows = useMemo<Row[]>(() => {
    const real: Row[] = history.map((p) => ({ year: p.year, value: p.value }))
    const last = history.at(-1)
    if (!last || aheadYears <= 0) return real
    real[real.length - 1].projected = last.value
    return [...real, ...projectBuyingPower(last, projectionRate, aheadYears).slice(1).map((p) => ({ year: p.year, projected: p.value }))]
  }, [history, aheadYears, projectionRate])

  if (!cpiFrom || !cpiTo) {
    return (
      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="px-4 sm:px-5 py-10 text-center text-sm text-muted-foreground">
          The price index could not be loaded. Try again in a moment.
        </CardContent>
      </Card>
    )
  }

  const worth = equivalent(amount, cpiFrom, cpiTo)
  const risePct = (cpiTo / cpiFrom - 1) * 100
  const lostPct = (1 - cpiFrom / cpiTo) * 100
  const avgPct = averageInflation(cpiFrom, cpiTo, to - from)
  const format = (value: number) => FORMAT[currency].format(value)
  const compact = (value: number) => COMPACT[currency].format(value)
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i)

  function fillFromPortfolio() {
    if (portfolioUsd === null) return
    const value = currency === 'PHP' && fx ? portfolioUsd * fx.rate : portfolioUsd
    setAmount(Math.round(value * 100) / 100)
    setPortfolioIn(currency)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardHeader className="px-4 sm:px-5">
          <CardTitle className="text-base font-semibold"><T k="calc.acrossYears" /></CardTitle>
          <CardDescription>Pick an amount and two years to compare.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 sm:px-5">
          <Field data-tut="purchasing.currency">
            <div className="flex items-center gap-1">
              <FieldLabel>Whose prices</FieldLabel>
              <TermHelp id="cpi" />
            </div>
            <FieldDescription>
              {COUNTRY[currency]} prices, in {currency === 'PHP' ? 'pesos (₱)' : 'dollars ($)'}. Use the $ / ₱ switch at the top to change.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={amountId}>Amount</FieldLabel>
            <NumberInput
              id={amountId}
              inputMode="decimal"
              min={0}
              value={amount}
              onValue={(next) => {
                if (next >= 0) setAmount(next)
                setPortfolioIn(null)
              }}
              className="figure h-10 rounded-xl"
            />
            {portfolioUsd !== null ? (
              <Button type="button" variant="link" className="h-auto justify-start px-0 text-xs" onClick={fillFromPortfolio}>
                Use my simulated portfolio balance
              </Button>
            ) : null}
            {usedPortfolio ? (
              <FieldDescription>
                Your balance today, taken back in time for comparison. Many of the companies you hold may not have
                existed then.
              </FieldDescription>
            ) : null}
          </Field>
          <div className="grid grid-cols-2 gap-3" data-tut="purchasing.years">
            <Field>
              <FieldLabel htmlFor={fromId}>From</FieldLabel>
              <NativeSelect id={fromId} value={from} onChange={(event) => setFromYear(Number(event.target.value))} className="h-10 w-full rounded-xl">
                {years.map((year) => (
                  <NativeSelectOption key={year} value={year}>
                    {year}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={toId}>To</FieldLabel>
              <NativeSelect id={toId} value={to} onChange={(event) => setToYear(Number(event.target.value))} className="h-10 w-full rounded-xl">
                {years.filter((year) => year >= from).map((year) => (
                  <NativeSelectOption key={year} value={year}>
                    {year}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3" data-tut="purchasing.future">
            <NumberField
              label="Future inflation"
              help="inflation"
              value={projectionRate}
              onChange={setInflationPct}
              min={0}
              max={50}
              step={0.1}
              suffix="% / yr"
              hint={`Long-run average since ${firstYear}: ${longRun.toFixed(1)}%.`}
            />
            <NumberField label="Project ahead" value={aheadYears} onChange={setAheadYears} min={0} max={50} suffix="yrs" help="projection" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5">
          <div data-tut="purchasing.result">
            <p className="text-sm text-muted-foreground">
              To buy what {format(amount)} bought in {from}, in {to} you need
            </p>
            <p className="figure text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{format(worth)}</p>
            <p className="mt-1 text-sm font-medium">
              Cash kept since {from} lost <span className="figure text-loss">{lostPct.toFixed(0)}%</span> of its value.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Prices rose" value={`${risePct.toFixed(0)}%`} tone="loss" />
            <Stat label="Buying power lost" value={`${lostPct.toFixed(0)}%`} />
            <Stat label="Average inflation" value={`${avgPct.toFixed(1)}% / yr`} />
          </div>

          <ChartContainer config={config} className="aspect-auto h-[240px] w-full" data-tut="purchasing.chart">
            <LineChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => compact(value)} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => String(payload?.[0]?.payload?.year ?? '')}
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-3">
                        <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                        <span className="figure font-medium">{format(Number(value))}</span>
                      </span>
                    )}
                  />
                }
              />
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
              <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2.25} dot={pointDot(rows.length, 'var(--color-value)')} isAnimationActive={false} />
              <Line
                dataKey="projected"
                type="monotone"
                stroke="var(--color-projected)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={pointDot(rows.length, 'var(--color-projected)')}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
          <LessonCard data-tut="purchasing.lesson" terms={['inflation', 'cpi']}>
            Prices rise almost every year, so money that sits still quietly shrinks. Investing aims to grow faster
            than prices do.
          </LessonCard>
          <p className="text-xs text-muted-foreground">
            The line is what {format(amount)} kept as cash since {from} buys, in {from} money. Dashed: the same
            loss carried {aheadYears} years ahead at {projectionRate}% a year. {COUNTRY[currency]} consumer prices,
            World Bank indicator FP.CPI.TOTL; {lastYear} is the latest year published.
          </p>

          <ShareResultButton
            filename="papaldo-purchasing-power"
            build={() => ({
              eyebrow: 'PAPALDO KA · PURCHASING POWER',
              title: `${format(amount)} in ${from} is like ${format(worth)} in ${to}`,
              subtitle: `${COUNTRY[currency]} prices rose ${risePct.toFixed(0)}% (${avgPct.toFixed(1)}% a year)`,
              stats: [
                { label: `In ${to}`, value: compact(worth) },
                { label: 'Prices rose', value: `${risePct.toFixed(0)}%` },
                { label: 'Buying power lost', value: `${lostPct.toFixed(0)}%` },
                { label: 'Average inflation', value: `${avgPct.toFixed(1)}%` },
              ],
              buysLabel: '',
              buys: [],
              chart: [
                { label: 'Buying power', values: rows.map((r) => r.value ?? null) },
                ...(aheadYears > 0 ? [{ label: 'Projected', values: rows.map((r) => r.projected ?? null), dashed: true }] : []),
              ],
              footer: 'Papaldo Ka · World Bank consumer price index · an estimate, not financial advice',
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
