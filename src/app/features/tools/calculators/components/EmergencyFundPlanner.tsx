'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ExternalLink } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { useFx } from '@/app/features/userData/preferences/components/Money'
import { pointDot } from '@/lib/chart-dots'

import {
  DEPOSIT_PRODUCTS,
  DEPOSIT_TAX_NOTE,
  DEPOSIT_TAX_RATE,
  DEPOSIT_TAX_SOURCE,
  PDIC_LIMIT_PHP,
  termLabel,
} from '../deposit-rates'
import { depositGrowth, projectFixed } from '../math'
import { AmountField, NumberField, ShareResultButton, Stat, useMoney } from './fields'

const config = {
  net: { label: 'Time deposit, after tax', color: 'var(--chart-2)' },
  gross: { label: 'Time deposit, before tax', color: 'var(--chart-3)' },
  investing: { label: 'Investing instead', color: 'var(--chart-1)' },
} satisfies ChartConfig

const dateLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { dateStyle: 'medium' })

/**
 * The emergency fund in a time deposit (Carlos, 2026-09-30): pick one of the
 * four banks' products, see what it earns before and after the 20% final tax,
 * and how that compares with investing the same money. Rates come from
 * `deposit-rates.ts`, each with its date and source. Nothing is saved.
 */
export function EmergencyFundPlanner({ investingRatePct = 7 }: { investingRatePct?: number }) {
  const money = useMoney()
  const fx = useFx()
  // About ₱100k by default -- three months of a modest household budget.
  const [amountUsd, setAmountUsd] = useState(1_700)
  const [productId, setProductId] = useState(DEPOSIT_PRODUCTS[0].id)
  const product = DEPOSIT_PRODUCTS.find((p) => p.id === productId) ?? DEPOSIT_PRODUCTS[0]
  const [termMonths, setTermMonths] = useState(product.terms[0].termMonths)
  const term = product.terms.find((t) => t.termMonths === termMonths) ?? product.terms[0]
  const [boosted, setBoosted] = useState(false)
  const [taxed, setTaxed] = useState(true)
  const [years, setYears] = useState(3)
  const [investPct, setInvestPct] = useState(investingRatePct)

  const ratePct = boosted && term.boostedPct ? term.boostedPct : term.ratePct
  const rows = useMemo(() => {
    const deposit = depositGrowth(amountUsd, ratePct, term.termMonths, years, taxed ? DEPOSIT_TAX_RATE : 0)
    const investing = projectFixed(amountUsd, 0, investPct, years)
    return deposit.map((row, i) => ({ year: row.year, net: row.net, gross: row.gross, investing: investing[i]?.balance ?? null }))
  }, [amountUsd, ratePct, term.termMonths, years, taxed, investPct])

  const last = rows[rows.length - 1]
  const grossInterest = last.gross - amountUsd
  const netInterest = last.net - amountUsd
  const overPdic = fx ? amountUsd * fx.rate > PDIC_LIMIT_PHP : false

  useTutorialDemo('savings.bank', () => {
    pickProduct('cimb-maxsave')
    setTermMonths(12)
  })

  function pickProduct(id: string) {
    const next = DEPOSIT_PRODUCTS.find((p) => p.id === id)
    if (!next) return
    setProductId(id)
    setTermMonths(next.terms[0].termMonths)
    setBoosted(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card className="rounded-2xl border-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base font-semibold">Emergency fund in a time deposit</CardTitle>
          <CardDescription>Park three to six months of expenses somewhere safe that still earns something.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-5">
          <AmountField label="Emergency fund" usd={amountUsd} onChange={setAmountUsd} />
          <Field data-tut="savings.bank">
            <FieldLabel>Bank</FieldLabel>
            <ToggleGroup
              variant="outline"
              spacing={0}
              className="grid w-full grid-cols-2 sm:grid-cols-4"
              value={[productId]}
              onValueChange={(value) => value[0] && pickProduct(value[0])}
            >
              {DEPOSIT_PRODUCTS.map((p) => (
                <ToggleGroupItem key={p.id} value={p.id} className="h-9 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                  {p.bank}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          {product.terms.length > 1 ? (
            <Field>
              <FieldLabel>Term</FieldLabel>
              <ToggleGroup
                variant="outline"
                spacing={0}
                className="w-full"
                value={[String(termMonths)]}
                onValueChange={(value) => value[0] && setTermMonths(Number(value[0]))}
              >
                {product.terms.map((t) => (
                  <ToggleGroupItem
                    key={t.termMonths}
                    value={String(t.termMonths)}
                    className="h-9 flex-1 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground"
                  >
                    {termLabel(t.termMonths)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          ) : null}

          <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="text-sm text-foreground">
              {product.bank} {product.product}: <span className="figure font-semibold">{ratePct}%</span> a year
              {product.kind === 'savings' ? ' (savings account)' : ` for ${termLabel(term.termMonths).toLowerCase()}`}
            </p>
            <p className="mt-1">{product.note}</p>
            <a
              href={product.source}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
            >
              Rate as of {dateLabel(product.asOf)}
              <ExternalLink className="size-3" />
            </a>
          </div>

          {term.boostedPct ? (
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox checked={boosted} onCheckedChange={(checked) => setBoosted(checked === true)} className="mt-0.5" />
              <span>
                Use the higher {term.boostedPct}% rate <span className="text-muted-foreground">(only if its conditions are met)</span>
              </span>
            </label>
          ) : null}
          <label className="flex items-start gap-2.5 text-sm" data-tut="savings.tax">
            <Checkbox checked={taxed} onCheckedChange={(checked) => setTaxed(checked === true)} className="mt-0.5" />
            <span>
              Apply the 20% final withholding tax
              <span className="block text-xs text-muted-foreground">
                {DEPOSIT_TAX_NOTE}{' '}
                <a href={DEPOSIT_TAX_SOURCE} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                  Source
                </a>
              </span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Keep it for" value={years} onChange={setYears} min={1} max={10} suffix="yrs" />
            <NumberField label="Investing return" value={investPct} onChange={setInvestPct} min={0} max={30} step={0.5} suffix="% / yr" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 py-5">
        <CardContent className="grid gap-4 px-5">
          <div className="grid grid-cols-3 gap-2">
            <Stat label={taxed ? 'Interest after tax' : 'Interest'} value={money.format(taxed ? netInterest : grossInterest)} tone="gain" />
            <Stat label="Tax withheld" value={money.format(taxed ? grossInterest - netInterest : 0)} />
            <Stat label={`After ${years} ${years === 1 ? 'year' : 'years'}`} value={money.compact(taxed ? last.net : last.gross)} tone="accent" />
          </div>

          <ChartContainer config={config} className="aspect-auto h-[240px] w-full" data-tut="savings.compare">
            <LineChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tickFormatter={(year: number) => `Y${year}`} />
              <YAxis width={64} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(value: number) => money.compact(value)} />
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
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="investing" type="monotone" stroke="var(--color-investing)" strokeWidth={2} strokeDasharray="6 4" dot={pointDot(rows.length, 'var(--color-investing)')} />
              {taxed ? (
                <Line dataKey="gross" type="monotone" stroke="var(--color-gross)" strokeWidth={2} dot={pointDot(rows.length, 'var(--color-gross)')} />
              ) : null}
              <Line dataKey="net" type="monotone" stroke="var(--color-net)" strokeWidth={2.5} dot={pointDot(rows.length, 'var(--color-net)')} />
            </LineChart>
          </ChartContainer>

          <p className="text-xs text-muted-foreground">
            The time deposit renews at the same rate every term. Investing is a steady {investPct}% a year for comparison
            only: it can fall, and it isn’t something to draw on in an emergency the way a deposit is.
            {product.kind === 'time-deposit' ? ' Breaking a time deposit early usually costs part of the interest.' : ''}
          </p>
          {overPdic ? (
            <p className="rounded-xl bg-loss/10 p-3 text-xs text-foreground ring-1 ring-loss/30">
              PDIC insures up to ₱1,000,000 per depositor, per bank. Above that, consider splitting the fund between banks.
            </p>
          ) : null}

          <ShareResultButton
            filename="papaldo-emergency-fund"
            build={() => ({
              eyebrow: 'PAPALDO KA · EMERGENCY FUND',
              title: `${money.compact(amountUsd)} in ${product.bank} earns ${money.format(taxed ? netInterest : grossInterest)} in ${years} ${years === 1 ? 'year' : 'years'}`,
              subtitle: `${ratePct}% a year${taxed ? ', after the 20% final tax' : ''}, rates as of ${dateLabel(product.asOf)}`,
              stats: [
                { label: 'Interest', value: money.format(taxed ? netInterest : grossInterest) },
                { label: 'Tax withheld', value: money.format(taxed ? grossInterest - netInterest : 0) },
                { label: 'Balance', value: money.compact(taxed ? last.net : last.gross) },
                { label: `Investing at ${investPct}%`, value: money.compact(last.investing ?? 0) },
              ],
              buysLabel: '',
              buys: [],
              chart: [
                { label: 'Time deposit', values: rows.map((r) => (taxed ? r.net : r.gross)) },
                { label: `Investing at ${investPct}%`, values: rows.map((r) => r.investing), dashed: true },
              ],
              footer: 'Papaldo Ka · a planning estimate, not a promise or financial advice',
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
