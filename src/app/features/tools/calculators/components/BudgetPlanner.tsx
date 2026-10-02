'use client'

import { useId, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { FileSpreadsheet, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { cn } from '@/lib/utils'

import { budgetTips, BUCKETS, PRESETS, splitBudget, TARGET_SHARE, type Bucket, type BudgetLine, type BudgetRegion } from '../budget'
import { budgetSheet } from '../workbook'
import { NumberInput, ShareResultButton } from './fields'
import { LessonCard, ResultHeadline, TermHelp } from './lesson'

const BUCKET_LABEL: Record<Bucket, string> = { needs: 'Needs', wants: 'Wants', savings: 'Savings & debt' }

// Amounts stay in the currency of the chosen context; a budget is planned in
// the money it is paid in, so nothing here is converted.
const CURRENCY: Record<BudgetRegion, { code: 'PHP' | 'USD'; format: Intl.NumberFormat }> = {
  PH: { code: 'PHP', format: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }) },
  INTL: { code: 'USD', format: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) },
}
const DEFAULT_PAY: Record<BudgetRegion, number> = { PH: 35_000, INTL: 4_000 }

const config = {
  target: { label: 'Target', color: 'var(--chart-2)' },
  actual: { label: 'Planned', color: 'var(--chart-1)' },
} satisfies ChartConfig

let nextId = 0
const fromPreset = (region: BudgetRegion): BudgetLine[] =>
  PRESETS[region].map((line) => ({ ...line, id: `line-${nextId++}`, amount: 0 }))

/**
 * The 50/30/20 budget (Carlos, 2026-09-30): take-home pay, a list of monthly
 * lines each tagged need, want or savings, and how the plan compares with the
 * 50/30/20 targets. Philippine or international presets. Runs entirely in the
 * browser; nothing is saved.
 */
export function BudgetPlanner() {
  const payId = useId()
  const [region, setRegion] = useState<BudgetRegion>('PH')
  const [pay, setPay] = useState(DEFAULT_PAY.PH)
  const [lines, setLines] = useState<BudgetLine[]>(() => fromPreset('PH'))
  const [exporting, setExporting] = useState<string | null>(null)
  const { format } = CURRENCY[region]

  const result = useMemo(() => splitBudget(pay, lines), [pay, lines])
  const tips = budgetTips(result, pay)
  const verdict = budgetVerdict(result.buckets)
  const chartRows = result.buckets.map((b) => ({ bucket: BUCKET_LABEL[b.bucket], target: b.target, actual: b.actual }))

  // "Show me": a typical month for the preset's first lines.
  useTutorialDemo('budget.lines', () => {
    const sample = region === 'PH' ? [12_000, 2_500, 500, 1_000, 2_000, 6_000, 0, 3_000, 3_500, 600, 2_000, 2_000] : [1_400, 150, 80, 200, 450, 150, 300, 100, 300, 350]
    setLines((current) => current.map((line, i) => ({ ...line, amount: sample[i] ?? line.amount })))
  })

  function update(id: string, patch: Partial<BudgetLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardHeader className="px-4 sm:px-5">
          <CardTitle className="text-base font-semibold">Your month</CardTitle>
          <CardDescription>Take-home pay, then what each peso or dollar is for.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 sm:px-5">
          <Field data-tut="budget.region">
            <FieldLabel>Where you live</FieldLabel>
            <ToggleGroup
              variant="outline"
              spacing={0}
              className="w-full"
              value={[region]}
              onValueChange={(value) => {
                const next = value[0] as BudgetRegion | undefined
                if (!next || next === region) return
                setRegion(next)
                setPay(DEFAULT_PAY[next])
                setLines(fromPreset(next))
              }}
            >
              <ToggleGroupItem value="PH" className="h-9 flex-1 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                Philippines (₱)
              </ToggleGroupItem>
              <ToggleGroupItem value="INTL" className="h-9 flex-1 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                Abroad ($)
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field data-tut="budget.pay">
            <div className="flex items-center gap-1">
              <FieldLabel htmlFor={payId}>Monthly take-home pay ({CURRENCY[region].code})</FieldLabel>
              <TermHelp id="takeHome" />
            </div>
            <NumberInput
              id={payId}
              inputMode="decimal"
              min={0}
              value={pay}
              onValue={(next) => {
                if (next >= 0) setPay(next)
              }}
              className="figure h-10 rounded-xl"
            />
          </Field>

          <div className="grid gap-2" data-tut="budget.lines">
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_2rem] gap-2 px-1 text-xs text-muted-foreground max-sm:hidden">
              <span>What for</span>
              <span>Kind</span>
              <span>Per month</span>
              <span />
            </div>
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_2rem] gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_2rem]">
                <Input
                  aria-label="What for"
                  value={line.label}
                  maxLength={60}
                  onChange={(event) => update(line.id, { label: event.target.value })}
                  className="h-9 rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${line.label || 'this line'}`}
                  onClick={() => setLines((current) => current.filter((l) => l.id !== line.id))}
                  className="self-center sm:order-last"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <NativeSelect
                  aria-label={`Kind of spending for ${line.label || 'this line'}`}
                  value={line.bucket}
                  onChange={(event) => update(line.id, { bucket: event.target.value as Bucket })}
                  className="h-9 w-full rounded-lg max-sm:col-span-1"
                >
                  {BUCKETS.map((bucket) => (
                    <NativeSelectOption key={bucket} value={bucket}>
                      {BUCKET_LABEL[bucket]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  aria-label={`Monthly amount for ${line.label || 'this line'}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={line.amount || ''}
                  placeholder="0"
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    update(line.id, { amount: Number.isFinite(next) && next >= 0 ? next : 0 })
                  }}
                  className="figure h-9 rounded-lg"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-9 justify-self-start rounded-full"
              onClick={() => setLines((current) => [...current, { id: `line-${nextId++}`, label: '', bucket: 'wants', amount: 0 }])}
            >
              <Plus />
              Add a line
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:px-5">
          <ResultHeadline lead={<>You take home <span className="figure font-medium text-foreground">{format.format(pay)}</span> a month. Here is where it goes.</>} verdict={verdict} />

          <div className="grid gap-2" data-tut="budget.buckets">
            {result.buckets.map((b) => {
              const over = b.gap > 0
              return (
                <div key={b.bucket} className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="flex items-center gap-1 text-sm font-medium">
                      {BUCKET_LABEL[b.bucket]}
                      <TermHelp id={b.bucket} />
                      <span className="text-muted-foreground">· target {TARGET_SHARE[b.bucket] * 100}%</span>
                    </p>
                    <p className={cn('figure text-sm font-semibold', over ? 'text-loss' : 'text-gain')}>{b.sharePct.toFixed(0)}%</p>
                  </div>
                  <p className="figure mt-0.5 text-xs text-muted-foreground">
                    {format.format(b.actual)} of {format.format(b.target)}
                    {over
                      ? b.bucket === 'savings'
                        ? ` · ${format.format(b.gap)} short`
                        : ` · ${format.format(b.gap)} over`
                      : ''}
                  </p>
                </div>
              )
            })}
            <p className={cn('figure text-sm', result.unallocated < 0 ? 'text-loss' : 'text-muted-foreground')}>
              {result.unallocated < 0
                ? `${format.format(-result.unallocated)} more than you take home`
                : `${format.format(result.unallocated)} not yet planned`}
            </p>
          </div>

          <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
            <BarChart data={chartRows} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
              <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => format.format(value)} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => (
                <span className="flex w-full justify-between gap-3">
                  <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                  <span className="figure font-medium">{format.format(Number(value))}</span>
                </span>
              )} />} />
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
              <Bar dataKey="target" fill="var(--color-target)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <ul className="grid gap-2 text-sm" data-tut="budget.tips">
            {tips.map((tip) => (
              <li key={tip} className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/25">
                {tip}
              </li>
            ))}
          </ul>

          <LessonCard data-tut="budget.lesson" terms={['budgetRule', 'needs', 'wants', 'savings']}>
            Needs first, a little fun, then pay yourself. Even 10% saved every month builds the habit; raise it when
            you can.
          </LessonCard>

          <div className="flex flex-wrap items-center gap-3" data-tut="budget.export">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 rounded-full px-4"
              disabled={exporting === 'busy'}
              onClick={async () => {
                setExporting('busy')
                try {
                  const { downloadWorkbook } = await import('../workbook-render')
                  await downloadWorkbook([budgetSheet(pay, lines, CURRENCY[region].code)], CURRENCY[region].code, 'papaldo-budget')
                  setExporting('Excel file saved to your downloads.')
                } catch {
                  setExporting('The Excel file could not be made. Try again.')
                }
              }}
            >
              <FileSpreadsheet className="size-4" />
              {exporting === 'busy' ? 'Making the file…' : 'Export to Excel'}
            </Button>
            {exporting && exporting !== 'busy' ? (
              <p className="text-xs text-muted-foreground" role="status">
                {exporting}
              </p>
            ) : null}
          </div>
          <ShareResultButton
            filename="papaldo-budget"
            build={() => ({
              eyebrow: 'PAPALDO KA · 50/30/20 BUDGET',
              title: `My ${format.format(pay)} month: ${result.buckets.map((b) => `${b.sharePct.toFixed(0)}%`).join(' / ')}`,
              subtitle: 'Needs / wants / savings, against the 50/30/20 rule',
              stats: result.buckets.map((b) => ({ label: `${BUCKET_LABEL[b.bucket]} (${TARGET_SHARE[b.bucket] * 100}%)`, value: format.format(b.actual) })),
              buysLabel: '',
              buys: [],
              footer: 'Papaldo Ka · a planning guide, not financial advice',
            })}
          />
          <p className="text-xs text-muted-foreground">
            The 50/30/20 rule is a starting point, not a law: in a high-rent city needs often run over half. Nothing you
            type here is saved or sent anywhere.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/** The one-line verdict: the biggest miss against the guide, or that it fits. */
function budgetVerdict(buckets: ReturnType<typeof splitBudget>['buckets']): React.ReactNode {
  const needs = buckets.find((b) => b.bucket === 'needs')
  const savings = buckets.find((b) => b.bucket === 'savings')
  if (needs && needs.gap > 0) {
    return (
      <>
        Needs take <span className="figure text-loss">{needs.sharePct.toFixed(0)}%</span> of your pay,{' '}
        {(needs.sharePct - TARGET_SHARE.needs * 100).toFixed(0)}% over the 50% guide
      </>
    )
  }
  if (savings && savings.gap > 0) {
    return (
      <>
        You save <span className="figure text-loss">{savings.sharePct.toFixed(0)}%</span>, short of the 20% guide
      </>
    )
  }
  const wants = buckets.find((b) => b.bucket === 'wants')
  if (wants && wants.gap > 0) {
    return (
      <>
        Wants take <span className="figure text-loss">{wants.sharePct.toFixed(0)}%</span>, over the 30% guide
      </>
    )
  }
  return <>Your month fits the 50/30/20 guide</>
}
