'use client'

import { useId, useMemo, useState } from 'react'
import { Check, Download, FileSpreadsheet, FileText, UserRound, ChartCandlestick } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFx } from '@/app/features/userData/preferences/components/Money'
import { cn } from '@/lib/utils'

import type { ExportData } from '../api/data'
import { downloadText, htmlReport, sparklineSvg, tableFrom, toCsv, type Column, type ReportSection, type Table } from '../formats'
import { summarize, withRealizedPnl, type TradeRow } from '../metrics'

type Persona = 'regular' | 'trader'
type DatasetId = 'summary' | 'holdings' | 'trades' | 'equity' | 'market' | 'bars' | 'profile'
type Format = 'csv' | 'html'

const DATASETS: Array<{ id: DatasetId; title: string; body: string; defaultFor: Persona[] }> = [
  { id: 'summary', title: 'Account summary', body: 'Starting cash, value now, total return. Traders also get win rate, profit factor and drawdown.', defaultFor: ['regular', 'trader'] },
  { id: 'holdings', title: 'Holdings', body: 'What you own, what it cost and what it is worth.', defaultFor: ['regular', 'trader'] },
  { id: 'trades', title: 'Trade history', body: 'Every fill. Traders get ticket numbers, average cost and realised profit per sale.', defaultFor: ['regular', 'trader'] },
  { id: 'equity', title: 'Daily account value', body: 'Your equity curve, one row per day.', defaultFor: ['trader'] },
  { id: 'market', title: 'Market snapshot', body: 'Prices for all 50 tradable names right now, like a Market Watch export.', defaultFor: ['trader'] },
  { id: 'bars', title: 'Price history', body: 'Daily open, high, low, close and volume for one symbol.', defaultFor: [] },
  { id: 'profile', title: 'Investing profile', body: 'Your profile details, risk band and quiz answers.', defaultFor: ['regular'] },
]

const BAR_RANGES = [
  { id: '1M', days: 31 },
  { id: '6M', days: 183 },
  { id: '1Y', days: 365 },
  { id: '5Y', days: 1826 },
] as const

const today = () => new Date().toISOString().slice(0, 10)
const round = (value: number, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits
/** Whether an ISO date or timestamp falls inside an optional YYYY-MM-DD range. */
const inRange = (iso: string, from: string, to: string) => (!from || iso.slice(0, 10) >= from) && (!to || iso.slice(0, 10) <= to)

function PersonaCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  body,
}: {
  selected: boolean
  onSelect: () => void
  icon: typeof UserRound
  title: string
  body: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-2xl p-4 text-left ring-1 ring-foreground/10 transition-colors hover:bg-accent/50',
        selected && 'bg-primary/8 ring-2 ring-primary/60',
      )}
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', selected ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 font-semibold">
          {title}
          <span className={cn('grid size-5 place-items-center rounded-full ring-1 ring-foreground/20', selected && 'bg-primary text-primary-foreground ring-0')}>
            {selected ? <Check className="size-3.5" /> : null}
          </span>
        </span>
        <span className="block text-[0.8125rem] text-muted-foreground">{body}</span>
      </span>
    </button>
  )
}

/**
 * The export engine (Carlos, 2026-09-29), modelled on what MetaTrader 5 lets
 * retail traders export: account history with performance figures, bar data
 * and a Market Watch snapshot -- scaled to what Papaldo has.
 *
 * Everything is built here in the browser from data the page already loaded,
 * and saved straight to the device as CSV (one file per dataset) or one HTML
 * report. Cancelling just resets the form: no file, no copy on the server.
 */
export function ExportBuilder({ data }: { data: ExportData }) {
  const fx = useFx()
  const ids = { from: useId(), to: useId(), symbol: useId(), side: useId(), bars: useId() }

  const [persona, setPersona] = useState<Persona>('regular')
  const [chosen, setChosen] = useState<DatasetId[]>(DATASETS.filter((d) => d.defaultFor.includes('regular')).map((d) => d.id))
  const [format, setFormat] = useState<Format>('csv')
  const [currency, setCurrency] = useState<'USD' | 'PHP'>('USD')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [symbol, setSymbol] = useState('ALL')
  const [side, setSide] = useState<'all' | 'buy' | 'sell'>('all')
  const [barSymbol, setBarSymbol] = useState(data.positions[0]?.symbol ?? data.market[0]?.symbol ?? 'SPY')
  const [barRange, setBarRange] = useState<(typeof BAR_RANGES)[number]['id']>('1Y')
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const rate = currency === 'PHP' && fx ? fx.rate : 1
  const money = (usd: number) => round(usd * rate)
  const cur = currency === 'PHP' && fx ? 'PHP' : 'USD'

  const symbols = useMemo(
    () => [...new Set([...data.orders.map((o) => o.symbol), ...data.positions.map((p) => p.symbol)])].sort(),
    [data.orders, data.positions],
  )
  const allSymbols = useMemo(() => [...new Set([...symbols, ...data.market.map((m) => m.symbol)])].sort(), [symbols, data.market])

  const tradeRows = useMemo(
    () =>
      withRealizedPnl(data.orders).filter(
        (row) =>
          inRange(row.filledAt, from, to) && (symbol === 'ALL' || row.symbol === symbol) && (side === 'all' || row.side === side),
      ),
    [data.orders, from, to, symbol, side],
  )
  const equity = useMemo(() => data.performance.filter((p) => inRange(p.date, from, to)), [data.performance, from, to])
  const holdings = useMemo(() => data.positions.filter((p) => symbol === 'ALL' || p.symbol === symbol), [data.positions, symbol])
  const summary = useMemo(() => summarize(tradeRows, equity), [tradeRows, equity])

  function choosePersona(next: Persona) {
    setPersona(next)
    setChosen(DATASETS.filter((d) => d.defaultFor.includes(next)).map((d) => d.id))
    setFormat(next === 'trader' ? 'csv' : 'html')
    setStatus(null)
  }

  function toggle(id: DatasetId, on: boolean) {
    setChosen((current) => (on ? [...current, id] : current.filter((c) => c !== id)))
  }

  function reset() {
    choosePersona('regular')
    setFrom('')
    setTo('')
    setSymbol('ALL')
    setSide('all')
    setStatus({ tone: 'ok', text: 'Cancelled. Nothing was saved.' })
  }

  const trader = persona === 'trader'
  const invested = data.positions.reduce((sum, p) => sum + p.value, 0)
  const totalReturnPct = ((data.total - data.startingCash) / data.startingCash) * 100

  function summaryTable(): Table {
    const rows: Array<[string, string | number | null]> = [
      ['Report date', data.generatedAt.slice(0, 10)],
      [`Starting cash (${cur})`, money(data.startingCash)],
      [`Account value (${cur})`, money(data.total)],
      [`Cash (${cur})`, money(data.cash)],
      [`Invested (${cur})`, money(invested)],
      ['Total return (%)', round(totalReturnPct)],
    ]
    if (trader) {
      rows.push(
        ['Trades', summary.trades],
        ['Buys', summary.buys],
        ['Sells', summary.sells],
        ['Win rate (%)', summary.winRatePct === null ? null : round(summary.winRatePct)],
        ['Profit factor', summary.profitFactor === null ? null : round(summary.profitFactor)],
        [`Gross profit (${cur})`, money(summary.grossProfit)],
        [`Gross loss (${cur})`, money(-summary.grossLoss)],
        [`Net realised (${cur})`, money(summary.netRealized)],
        [`Largest win (${cur})`, money(summary.largestWin)],
        [`Largest loss (${cur})`, money(summary.largestLoss)],
        [`Average trade size (${cur})`, money(summary.averageTradeSize)],
        ['Maximum drawdown (%)', round(summary.maxDrawdownPct)],
      )
    }
    return { title: 'Account summary', headers: ['Item', 'Value'], rows }
  }

  function tradesTable(): Table {
    const columns: Column<TradeRow>[] = trader
      ? [
          { id: 'ticket', label: 'Ticket', value: (r) => r.id.slice(0, 8) },
          { id: 'time', label: 'Time (UTC)', value: (r) => r.filledAt.replace('T', ' ').slice(0, 19) },
          { id: 'symbol', label: 'Symbol', value: (r) => r.symbol },
          { id: 'side', label: 'Type', value: (r) => r.side },
          { id: 'qty', label: 'Volume', value: (r) => r.quantity },
          { id: 'price', label: `Price (${cur})`, value: (r) => money(r.fillPrice) },
          { id: 'amount', label: `Amount (${cur})`, value: (r) => money(r.cashAmount) },
          { id: 'avg', label: `Avg cost before (${cur})`, value: (r) => money(r.avgCostBefore) },
          { id: 'pnl', label: `Realised P/L (${cur})`, value: (r) => (r.realizedPnl === null ? null : money(r.realizedPnl)) },
        ]
      : [
          { id: 'date', label: 'Date', value: (r) => r.filledAt.slice(0, 10) },
          { id: 'symbol', label: 'Symbol', value: (r) => r.symbol },
          { id: 'side', label: 'Bought or sold', value: (r) => (r.side === 'buy' ? 'Bought' : 'Sold') },
          { id: 'qty', label: 'Shares', value: (r) => r.quantity },
          { id: 'price', label: `Price (${cur})`, value: (r) => money(r.fillPrice) },
          { id: 'amount', label: `Total (${cur})`, value: (r) => money(r.cashAmount) },
        ]
    return tableFrom('Trade history', columns, [...tradeRows].reverse())
  }

  function holdingsTable(): Table {
    type H = ExportData['positions'][number]
    const pct = (h: H) => (h.costBasis > 0 ? round((h.unrealized / h.costBasis) * 100) : null)
    const columns: Column<H>[] = trader
      ? [
          { id: 'symbol', label: 'Symbol', value: (h) => h.symbol },
          { id: 'sector', label: 'Sector', value: (h) => h.sector },
          { id: 'qty', label: 'Quantity', value: (h) => h.quantity },
          { id: 'avg', label: `Avg cost (${cur})`, value: (h) => money(h.avgCost) },
          { id: 'price', label: `Last (${cur})`, value: (h) => money(h.price) },
          { id: 'value', label: `Market value (${cur})`, value: (h) => money(h.value) },
          { id: 'basis', label: `Cost basis (${cur})`, value: (h) => money(h.costBasis) },
          { id: 'pl', label: `Unrealised P/L (${cur})`, value: (h) => money(h.unrealized) },
          { id: 'plpct', label: 'P/L (%)', value: pct },
          { id: 'weight', label: 'Weight (%)', value: (h) => (data.total > 0 ? round((h.value / data.total) * 100) : null) },
        ]
      : [
          { id: 'symbol', label: 'Symbol', value: (h) => h.symbol },
          { id: 'qty', label: 'Shares', value: (h) => h.quantity },
          { id: 'value', label: `Worth now (${cur})`, value: (h) => money(h.value) },
          { id: 'pl', label: `Gain or loss (${cur})`, value: (h) => money(h.unrealized) },
          { id: 'plpct', label: 'Gain or loss (%)', value: pct },
        ]
    return tableFrom('Holdings', columns, holdings)
  }

  function equityTable(): Table {
    return {
      title: 'Daily account value',
      headers: ['Date', `Account value (${cur})`, 'Change since start (%)'],
      rows: equity.map((p) => [p.date, money(p.value), round(((p.value - data.startingCash) / data.startingCash) * 100)]),
    }
  }

  function marketTable(): Table {
    return {
      title: 'Market snapshot',
      headers: ['Symbol', 'Name', 'Sector', `Last (${cur})`, `Change (${cur})`, 'Change (%)', `Open (${cur})`, `High (${cur})`, `Low (${cur})`, `Prev close (${cur})`, 'Volume', 'Time (UTC)'],
      rows: data.market.map((m) => [
        m.symbol, m.name, m.sector, money(m.price), money(m.change), round(m.changePercent), money(m.open), money(m.high),
        money(m.low), money(m.previousClose), m.volume, m.at.replace('T', ' ').slice(0, 19),
      ]),
    }
  }

  function profileTable(): Table {
    const a = data.account
    return {
      title: 'Investing profile',
      headers: ['Item', 'Value'],
      rows: [
        ['Username', a.username],
        ['Email', a.email],
        ['Occupation', a.occupation],
        ['Annual income', a.annualIncome],
        ['Ideal income', a.idealIncome],
        ['Risk band', a.riskBand],
        ['Risk score (of 100)', a.riskScore],
        ['Quiz taken', a.quizTakenAt?.slice(0, 10) ?? null],
        ...a.answers.map((q, i): [string, string] => [`Q${i + 1}. ${q.question}`, q.answer]),
      ],
    }
  }

  async function barsTable(): Promise<Table> {
    const days = BAR_RANGES.find((r) => r.id === barRange)?.days ?? 365
    const response = await fetch(`/api/export/bars?symbol=${encodeURIComponent(barSymbol)}&days=${days}`)
    const result = (await response.json()) as { ok: boolean; message?: string; bars?: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> }
    if (!result.ok || !result.bars) throw new Error(result.message ?? 'Price history could not be loaded.')
    return {
      title: `Price history · ${barSymbol}`,
      headers: ['Date', `Open (${cur})`, `High (${cur})`, `Low (${cur})`, `Close (${cur})`, 'Volume'],
      rows: result.bars.map((b) => [b.time, money(b.open), money(b.high), money(b.low), money(b.close), b.volume]),
    }
  }

  async function build(): Promise<Array<{ id: DatasetId; table: Table }>> {
    const out: Array<{ id: DatasetId; table: Table }> = []
    for (const id of DATASETS.map((d) => d.id).filter((d) => chosen.includes(d))) {
      if (id === 'summary') out.push({ id, table: summaryTable() })
      if (id === 'holdings') out.push({ id, table: holdingsTable() })
      if (id === 'trades') out.push({ id, table: tradesTable() })
      if (id === 'equity') out.push({ id, table: equityTable() })
      if (id === 'market' && data.market.length) out.push({ id, table: marketTable() })
      if (id === 'bars') out.push({ id, table: await barsTable() })
      if (id === 'profile') out.push({ id, table: profileTable() })
    }
    return out
  }

  async function download() {
    setBusy(true)
    setStatus(null)
    try {
      const tables = await build()
      const stamp = today()
      if (format === 'csv') {
        tables.forEach(({ id, table }, i) => {
          setTimeout(() => downloadText(toCsv(table), `papaldo-${id}-${stamp}.csv`, 'text/csv;charset=utf-8'), i * 400)
        })
        setStatus({ tone: 'ok', text: `${tables.length} CSV file${tables.length === 1 ? '' : 's'} saved to your device.` })
      } else {
        const sections: ReportSection[] = tables.map(({ id, table }) => ({
          title: table.title,
          table,
          chart: id === 'equity' ? sparklineSvg(equity.map((p) => p.value)) : undefined,
        }))
        const html = htmlReport(
          trader ? 'Papaldo trading report' : 'My Papaldo report',
          `${data.account.username ?? data.account.email} · generated ${stamp} · amounts in ${cur}${from || to ? ` · ${from || 'start'} to ${to || 'today'}` : ''}`,
          sections,
          'Simulated trading with play money on Papaldo Ka. Not financial advice. Created in your browser; Papaldo keeps no copy.',
        )
        downloadText(html, `papaldo-report-${stamp}.html`, 'text/html;charset=utf-8')
        setStatus({ tone: 'ok', text: 'HTML report saved to your device.' })
      }
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'The export could not be created.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
      <div className="grid gap-4">
        <Card className="rounded-2xl border-0 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-base font-semibold">Who is this report for?</CardTitle>
            <CardDescription>This picks sensible defaults. You can change anything below.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 sm:grid-cols-2" role="radiogroup" aria-label="Report type">
            <PersonaCard selected={persona === 'regular'} onSelect={() => choosePersona('regular')} icon={UserRound} title="I’m a regular person" body="A plain summary of what I own, what I did and my investing profile." />
            <PersonaCard selected={persona === 'trader'} onSelect={() => choosePersona('trader')} icon={ChartCandlestick} title="I’m into trading" body="Full trade log, performance statistics and market data, like MetaTrader’s reports." />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-base font-semibold">What to include</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 px-5 sm:grid-cols-2">
            {DATASETS.map((dataset) => {
              const id = `export-${dataset.id}`
              const on = chosen.includes(dataset.id)
              return (
                <label key={dataset.id} htmlFor={id} className={cn('flex cursor-pointer gap-3 rounded-xl p-3 ring-1 ring-foreground/10', on && 'bg-accent/40')}>
                  <Checkbox id={id} checked={on} onCheckedChange={(checked) => toggle(dataset.id, Boolean(checked))} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">{dataset.title}</span>
                    <span className="block text-xs text-muted-foreground">{dataset.body}</span>
                  </span>
                </label>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-base font-semibold">Filters</CardTitle>
            <CardDescription>Dates apply to trades and daily values. Symbol applies to trades and holdings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor={ids.from}>From</FieldLabel>
              <Input id={ids.from} type="date" value={from} max={to || today()} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-xl" />
            </Field>
            <Field>
              <FieldLabel htmlFor={ids.to}>To</FieldLabel>
              <Input id={ids.to} type="date" value={to} min={from || undefined} max={today()} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-xl" />
            </Field>
            <Field>
              <FieldLabel htmlFor={ids.symbol}>Symbol</FieldLabel>
              <NativeSelect id={ids.symbol} value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-10 w-full rounded-xl">
                <NativeSelectOption value="ALL">All symbols</NativeSelectOption>
                {symbols.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {s}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={ids.side}>Trades</FieldLabel>
              <NativeSelect id={ids.side} value={side} onChange={(e) => setSide(e.target.value as typeof side)} className="h-10 w-full rounded-xl">
                <NativeSelectOption value="all">Buys and sells</NativeSelectOption>
                <NativeSelectOption value="buy">Buys only</NativeSelectOption>
                <NativeSelectOption value="sell">Sells only</NativeSelectOption>
              </NativeSelect>
            </Field>
            {chosen.includes('bars') ? (
              <>
                <Field className="sm:col-span-1 lg:col-span-2">
                  <FieldLabel htmlFor={ids.bars}>Price history for</FieldLabel>
                  <NativeSelect id={ids.bars} value={barSymbol} onChange={(e) => setBarSymbol(e.target.value)} className="h-10 w-full rounded-xl">
                    {allSymbols.map((s) => (
                      <NativeSelectOption key={s} value={s}>
                        {s}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field className="lg:col-span-2">
                  <FieldLabel>Over the last</FieldLabel>
                  <ToggleGroup variant="outline" spacing={2} value={[barRange]} onValueChange={(v) => v[0] && setBarRange(v[0] as typeof barRange)}>
                    {BAR_RANGES.map((r) => (
                      <ToggleGroupItem key={r.id} value={r.id} className="h-10 min-w-12 aria-pressed:bg-primary/10">
                        {r.id}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit rounded-2xl border-0 py-5 xl:sticky xl:top-4">
        <CardHeader className="px-5">
          <CardTitle className="text-base font-semibold">Your file</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-5">
          <Field>
            <FieldLabel>Format</FieldLabel>
            <ToggleGroup variant="outline" spacing={2} className="w-full" value={[format]} onValueChange={(v) => v[0] && setFormat(v[0] as Format)}>
              <ToggleGroupItem value="csv" className="h-10 flex-1 gap-2 aria-pressed:bg-primary/10">
                <FileSpreadsheet className="size-4" /> CSV
              </ToggleGroupItem>
              <ToggleGroupItem value="html" className="h-10 flex-1 gap-2 aria-pressed:bg-primary/10">
                <FileText className="size-4" /> HTML report
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel>Amounts in</FieldLabel>
            <ToggleGroup variant="outline" spacing={2} className="w-full" value={[currency]} onValueChange={(v) => v[0] && setCurrency(v[0] as 'USD' | 'PHP')}>
              <ToggleGroupItem value="USD" className="h-10 flex-1 aria-pressed:bg-primary/10">
                US dollars
              </ToggleGroupItem>
              <ToggleGroupItem value="PHP" disabled={!fx} className="h-10 flex-1 aria-pressed:bg-primary/10">
                Pesos
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <ul className="grid gap-1 text-sm">
            {chosen.length === 0 ? <li className="text-muted-foreground">Pick at least one thing to include.</li> : null}
            {chosen.includes('trades') ? <li>{tradeRows.length.toLocaleString('en-US')} trades</li> : null}
            {chosen.includes('holdings') ? <li>{holdings.length} holdings</li> : null}
            {chosen.includes('equity') ? <li>{equity.length.toLocaleString('en-US')} days of account value</li> : null}
            {chosen.includes('market') ? <li>{data.market.length} market prices</li> : null}
            {chosen.includes('bars') ? <li>Daily prices for {barSymbol}, last {barRange}</li> : null}
            {chosen.includes('summary') ? <li>Account summary</li> : null}
            {chosen.includes('profile') ? <li>Investing profile and quiz answers</li> : null}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button onClick={download} disabled={busy || chosen.length === 0} className="h-10 flex-1 gap-2 rounded-full font-semibold">
              <Download className="size-4" />
              {busy ? 'Building…' : format === 'csv' ? 'Download CSV' : 'Download report'}
            </Button>
            <Button variant="outline" onClick={reset} disabled={busy} className="h-10 rounded-full px-4">
              Cancel
            </Button>
          </div>
          {status ? (
            <p role="status" className={cn('text-sm', status.tone === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
              {status.text}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Files are made in your browser and saved straight to your device. Papaldo keeps no copy, and cancelling
            leaves nothing behind.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
