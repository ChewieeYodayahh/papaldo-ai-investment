'use client'

import { useMemo, useState } from 'react'
import { Crown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useFx } from '@/app/features/userData/preferences/components/Money'
import { cn } from '@/lib/utils'

import { lastYears, replayHistory, type MonthlyPoint, type ReplayResult } from '../math'
import { whatItBuys } from '../purchases'
import { AmountField, ShareResultButton, useMoney, WhatItBuys } from './fields'
import { YEAR_OPTIONS, type YearOption } from './ReturnsCalculator'
import { SavingsGoalDialog } from './SavingsGoalDialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type CompareSeries = { key: string; label: string; color: string; points: MonthlyPoint[] }

type Row = { series: CompareSeries; result: ReplayResult }

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/**
 * The compound-growth calculator under the index benchmarker (Carlos,
 * 2026-09-29): the same money, the same monthly top-up, replayed through each
 * index's real monthly history, side by side. Pick a row to see what its
 * result buys; "How much should I save?" opens the goal calculator with each
 * index's historical growth rate one click away.
 */
export function ReturnsCompare({ series }: { series: CompareSeries[] }) {
  const money = useMoney()
  const fx = useFx()
  const [initialUsd, setInitialUsd] = useState(1_000)
  const [monthlyUsd, setMonthlyUsd] = useState(100)
  const [years, setYears] = useState<YearOption>(10)
  const [selected, setSelected] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)

  const rows = useMemo(
    () =>
      series
        .map((s) => ({ series: s, result: replayHistory(lastYears(s.points, years), initialUsd, monthlyUsd) }))
        .filter((row): row is Row => row.result !== null)
        .sort((a, b) => b.result.finalValue - a.result.finalValue),
    [series, years, initialUsd, monthlyUsd],
  )
  if (rows.length === 0) return null

  const best = rows[0]
  const max = best.result.finalValue
  const focus = rows.find((row) => row.series.key === selected) ?? best
  const since = lastYears(best.series.points, years)[0]?.date
  const sinceLabel = since ? monthLabel.format(new Date(`${since}T00:00:00Z`)) : ''

  return (
    <Card className="rounded-2xl border-0 py-4 sm:py-5">
      <CardHeader className="px-4 sm:px-5">
        <CardTitle className="text-base font-semibold">If you had invested</CardTitle>
        <CardDescription>
          The same money in each index, using their real monthly prices. Tap an index to see what its result buys.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 px-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <AmountField label="Start with" usd={initialUsd} onChange={setInitialUsd} />
          <AmountField label="Add every month" usd={monthlyUsd} onChange={setMonthlyUsd} />
          <ToggleGroup
            variant="outline"
            spacing={2}
            aria-label="Starting"
            className="sm:col-span-2 lg:col-span-1"
            value={[String(years)]}
            onValueChange={(value) => value[0] && setYears(value[0] === 'max' ? 'max' : (Number(value[0]) as YearOption))}
          >
            {YEAR_OPTIONS.map((option) => (
              <ToggleGroupItem key={option} value={String(option)} className="h-10 min-w-12 aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                {option === 'max' ? 'Max' : `${option}Y`}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <p className="text-sm text-muted-foreground">
          Since {sinceLabel}, you would have put in <span className="figure font-medium text-foreground">{money.format(best.result.contributed)}</span>.
        </p>

        <ul className="grid gap-2" aria-label="Results by index">
          {rows.map((row) => {
            const isFocus = row.series.key === focus.series.key
            const width = max > 0 ? Math.max(4, (row.result.finalValue / max) * 100) : 0
            return (
              <li key={row.series.key}>
                <button
                  type="button"
                  onClick={() => setSelected(row.series.key)}
                  aria-pressed={isFocus}
                  className={cn(
                    'grid w-full gap-1.5 rounded-xl p-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-accent/60',
                    isFocus && 'bg-accent/50 ring-primary/40',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.series.color }} aria-hidden />
                    <span className="text-sm font-medium">{row.series.label}</span>
                    {row === best ? (
                      <Badge className="gap-1 rounded-full bg-primary/15 px-2 text-primary">
                        <Crown className="size-3" /> Best
                      </Badge>
                    ) : null}
                    <span className="figure ml-auto text-sm font-semibold">{money.format(row.result.finalValue)}</span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full" style={{ width: `${width}%`, backgroundColor: row.series.color }} />
                  </span>
                  <span className="figure flex justify-between text-xs text-muted-foreground">
                    <span>
                      Growth {money.compact(row.result.growth)} · {(row.result.finalValue / Math.max(1, row.result.contributed)).toFixed(2)}×
                    </span>
                    <span>{row.result.cagrPct === null ? '' : `${row.result.cagrPct.toFixed(1)}% a year`}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <WhatItBuys amountUsd={focus.result.finalValue} label={`${focus.series.label}’s result is enough for`} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <Checkbox checked={saveOpen} onCheckedChange={(checked) => setSaveOpen(Boolean(checked))} />
            How much should I save?
          </label>
          <ShareResultButton
            filename="papaldo-index-returns"
            build={() => ({
              eyebrow: 'PAPALDO KA · INDEX BENCHMARKER',
              title: `${money.compact(best.result.contributed)} since ${sinceLabel} became ${money.compact(best.result.finalValue)} in the ${best.series.label}`,
              subtitle: `${money.format(initialUsd)} to start${monthlyUsd > 0 ? `, ${money.format(monthlyUsd)} a month` : ''}, same money in every index`,
              stats: rows.slice(0, 4).map((row) => ({ label: row.series.label, value: money.compact(row.result.finalValue) })),
              buysLabel: `${focus.series.label}’s result is enough for`,
              buys: whatItBuys(focus.result.finalValue, fx?.rate ?? null).map((p) => p.text),
              footer: 'Papaldo Ka · real monthly index prices, dividends not included · past performance, not financial advice',
            })}
          />
        </div>
      </CardContent>

      <SavingsGoalDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        presets={rows
          .filter((row) => row.result.cagrPct !== null)
          .map((row) => ({ label: row.series.label, ratePct: row.result.cagrPct as number }))}
        initialRatePct={Math.max(0, focus.result.cagrPct ?? 7)}
      />
    </Card>
  )
}
