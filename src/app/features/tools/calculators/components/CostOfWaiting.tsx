'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { pointDot } from '@/lib/chart-dots'
import { cn } from '@/lib/utils'

import { costOfWaiting } from '../strategies'
import { AmountField, NumberField, ShareResultButton, useMoney } from './fields'

const DELAYS = [0, 5, 10, 15] as const
const KEYS = ['now', 'wait5', 'wait10', 'wait15'] as const

const config = {
  now: { label: 'Start today', color: 'var(--chart-1)' },
  wait5: { label: 'Wait 5 years', color: 'var(--chart-2)' },
  wait10: { label: 'Wait 10 years', color: 'var(--chart-3)' },
  wait15: { label: 'Wait 15 years', color: 'var(--chart-4)' },
} satisfies ChartConfig

/**
 * The cost of waiting (Carlos, 2026-09-30): the same monthly amount saved
 * until retirement, starting today versus 5, 10 or 15 years from now, at a
 * steady yearly return. Each year of waiting is growth that never happens.
 */
export function CostOfWaiting() {
  const money = useMoney()
  const [age, setAge] = useState(22)
  const [retireAge, setRetireAge] = useState(60)
  // About ₱3,000 a month.
  const [monthlyUsd, setMonthlyUsd] = useState(50)
  const [ratePct, setRatePct] = useState(7)
  useTutorialDemo('waiting.inputs', () => {
    setAge(25)
    setRetireAge(65)
    setMonthlyUsd(100)
  })

  const retire = Math.max(retireAge, age + 1)
  const scenarios = useMemo(() => costOfWaiting(age, retire, monthlyUsd, ratePct, [...DELAYS]), [age, retire, monthlyUsd, ratePct])
  const rows = useMemo(
    () =>
      scenarios[0].byAge.map((point, i) =>
        Object.fromEntries([['age', point.age], ...scenarios.map((scenario, s) => [KEYS[s], scenario.byAge[i].balance])]),
      ),
    [scenarios],
  )
  const [now] = scenarios

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card className="rounded-2xl border-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base font-semibold">You, today</CardTitle>
          <CardDescription>Your age, when you want to stop working, and what you could put away each month.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-5" data-tut="waiting.inputs">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Your age" value={age} onChange={setAge} min={15} max={80} suffix="yrs" />
            <NumberField label="Retire at" value={retireAge} onChange={setRetireAge} min={30} max={90} suffix="yrs" />
          </div>
          <AmountField label="Every month" usd={monthlyUsd} onChange={setMonthlyUsd} />
          <NumberField
            label="Expected return"
            value={ratePct}
            onChange={setRatePct}
            min={0}
            max={20}
            step={0.5}
            suffix="% / yr"
            hint="About 7% is a common planning figure for a diversified index fund. Not guaranteed."
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-5">
        <CardContent className="grid gap-4 px-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-tut="waiting.results">
            {scenarios.map((scenario, i) => {
              const lost = now.final - scenario.final
              return (
                <div key={scenario.delay} className={cn('rounded-xl p-3', i === 0 ? 'bg-primary/10 ring-1 ring-primary/25' : 'bg-muted/50')}>
                  <p className="text-xs text-muted-foreground">{i === 0 ? 'Start today' : `Wait ${scenario.delay} years`}</p>
                  <p className={cn('figure text-lg font-semibold', i === 0 && 'text-primary')}>{money.compact(scenario.final)}</p>
                  <p className="figure text-xs text-muted-foreground">
                    {i === 0 ? `from ${money.compact(scenario.contributed)} put in` : scenario.final === 0 ? 'too late to start' : `−${money.compact(lost)}`}
                  </p>
                </div>
              )
            })}
          </div>

          <ChartContainer config={config} className="aspect-auto h-[260px] w-full" data-tut="waiting.chart">
            <LineChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="age" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => money.compact(value)} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => `Age ${payload?.[0]?.payload?.age ?? ''}`}
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-3">
                        <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                        <span className="figure font-medium">{money.format(Number(value))}</span>
                      </span>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {KEYS.map((key) => (
                <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={key === 'now' ? 2.5 : 1.75} dot={pointDot(rows.length, `var(--color-${key})`)} isAnimationActive={false} />
              ))}
            </LineChart>
          </ChartContainer>

          <p className="text-sm" data-tut="waiting.lesson">
            Waiting 10 years costs <span className="figure font-semibold text-loss">{money.format(now.final - scenarios[2].final)}</span> by
            age {retire}, though you would have put in only {money.format(now.contributed - scenarios[2].contributed)} less. The
            early years do the most work, because their growth has the longest to compound.
          </p>

          <ShareResultButton
            filename="papaldo-cost-of-waiting"
            build={() => ({
              eyebrow: 'PAPALDO KA · THE COST OF WAITING',
              title: `Waiting 10 years costs ${money.compact(now.final - scenarios[2].final)} by age ${retire}`,
              subtitle: `${money.format(monthlyUsd)} a month from age ${age}, at ${ratePct}% a year`,
              stats: scenarios.map((scenario, i) => ({ label: i === 0 ? 'Start today' : `Wait ${scenario.delay} yrs`, value: money.compact(scenario.final) })),
              buysLabel: '',
              buys: [],
              chart: scenarios.slice(0, 3).map((scenario, i) => ({
                label: i === 0 ? 'Start today' : `Wait ${scenario.delay} years`,
                values: scenario.byAge.map((point) => point.balance),
                dashed: i > 0,
              })),
              footer: 'Papaldo Ka · a planning estimate at a steady return, not a promise or financial advice',
            })}
          />
          <p className="text-xs text-muted-foreground">
            A steady return every year, deposits at the end of each month, no fees or taxes. Real markets go up and down.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
