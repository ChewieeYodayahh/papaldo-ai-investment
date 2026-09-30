'use client'

import { useEffect, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Download, FileText, Plus, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { downloadText, htmlReport, toCsv, type Table } from '@/app/features/userData/export/formats'
import { cn } from '@/lib/utils'

import {
  DRAFT_KEY,
  emptyStatements,
  lineId,
  parseDraft,
  sampleStatements,
  serializeDraft,
  statementRows,
  totals,
  type Line,
  type Statements,
} from '../statements'

type LineKey = 'revenue' | 'expenses' | 'assets' | 'liabilities' | 'operating' | 'investing' | 'financing'
type NumberKey = 'cash' | 'capital' | 'openingRetained' | 'dividends' | 'openingCash'

const FORMAT = {
  PHP: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
}

// localStorage can throw (private mode, blocked storage); the tool still works without it.
function readStorage(): string | null {
  try {
    return window.localStorage.getItem(DRAFT_KEY)
  } catch {
    return null
  }
}
function writeStorage(value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(DRAFT_KEY)
    else window.localStorage.setItem(DRAFT_KEY, value)
  } catch {
    // Not saved; nothing else depends on it.
  }
}

/**
 * Financial statements (Carlos, 2026-09-30): an income statement, balance
 * sheet and cash-flow statement with editable lines, checked against each
 * other as you type. Kept only in this browser -- a draft clears itself after
 * five days without an edit -- and exported as CSV or HTML on the device.
 */
export function StatementsBuilder() {
  const [s, setS] = useState<Statements>(() => emptyStatements())
  const [notice, setNotice] = useState<string | null>(null)
  const loaded = useRef(false)
  // The statements as last loaded or cleared. Only a real edit differs from it,
  // so opening the page never re-dates a draft (it must expire five days
  // after the last *edit*) and an untouched template is never stored.
  const baseline = useRef('')
  const t = totals(s)
  const format = (value: number) => FORMAT[s.currency].format(value)

  // Restore a draft after mount (the server render has no storage).
  useEffect(() => {
    const draft = parseDraft(readStorage(), Date.now())
    if (draft && 'data' in draft) {
      baseline.current = JSON.stringify(draft.data)
      setS(draft.data)
      setNotice(`Draft restored from ${new Date(draft.lastEditedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}.`)
    } else {
      baseline.current = JSON.stringify(s)
      if (draft && 'expired' in draft) {
        writeStorage(null)
        setNotice('Your last draft was more than five days old, so it was cleared.')
      }
    }
    loaded.current = true
    // Mount only: `s` here is the initial empty template.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save each edit, a moment after typing stops.
  useEffect(() => {
    if (!loaded.current || JSON.stringify(s) === baseline.current) return
    const timer = window.setTimeout(() => writeStorage(serializeDraft(s, Date.now())), 400)
    return () => window.clearTimeout(timer)
  }, [s])

  function loadSample() {
    setS(sampleStatements())
    setNotice('Loaded the sample: a sari-sari store’s year. Change anything.')
  }
  useTutorialDemo('statements.sample', loadSample)

  function startOver() {
    const fresh = emptyStatements(s.currency)
    baseline.current = JSON.stringify(fresh)
    setS(fresh)
    writeStorage(null)
    setNotice('Cleared. Nothing is kept.')
  }

  const setLine = (key: LineKey, id: string, patch: Partial<Line>) =>
    setS((current) => ({ ...current, [key]: current[key].map((line) => (line.id === id ? { ...line, ...patch } : line)) }))
  const addLine = (key: LineKey) => setS((current) => ({ ...current, [key]: [...current[key], { id: lineId(), label: '', amount: 0 }] }))
  const removeLine = (key: LineKey, id: string) => setS((current) => ({ ...current, [key]: current[key].filter((line) => line.id !== id) }))
  const setNumber = (key: NumberKey, value: number) => setS((current) => ({ ...current, [key]: value }))

  function exportAs(kind: 'csv' | 'html') {
    const name = (s.company || 'financial-statements').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const rows = statementRows(s)
    if (kind === 'csv') {
      const table: Table = { title: 'Financial statements', headers: ['Statement', 'Section', 'Item', `Amount (${s.currency})`], rows }
      downloadText(toCsv(table), `${name}.csv`, 'text/csv;charset=utf-8')
      return
    }
    const section = (title: string): Table => ({
      title,
      headers: ['Section', 'Item', `Amount (${s.currency})`],
      rows: rows.filter((row) => row[0] === title).map(([, sectionName, item, amount]) => [sectionName, item, format(amount)]),
    })
    const html = htmlReport(
      s.company || 'Financial statements',
      s.period || 'Built with Papaldo’s financial statements tool',
      [
        {
          title: 'Checks',
          stats: [
            { label: 'Net income', value: format(t.netIncome) },
            { label: 'Balance sheet', value: t.balances ? 'Balances' : `Off by ${format(t.balanceGap)}` },
            { label: 'Cash', value: t.cashTies ? 'Ties to the balance sheet' : `Off by ${format(t.cashGap)}` },
          ],
        },
        { title: 'Income statement', table: section('Income statement') },
        { title: 'Balance sheet', table: section('Balance sheet') },
        { title: 'Cash flow', table: section('Cash flow') },
      ],
      'Made in the browser with Papaldo · for learning, not an audited statement',
    )
    downloadText(html, `${name}.html`, 'text/html;charset=utf-8')
  }

  function lineList(key: LineKey, addLabel: string) {
    return (
      <div className="grid gap-2">
        {s[key].map((line) => (
          <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_8.5rem_2rem] gap-2">
            <Input
              aria-label="Line item"
              value={line.label}
              maxLength={80}
              placeholder="Item"
              onChange={(event) => setLine(key, line.id, { label: event.target.value })}
              className="h-9 rounded-lg"
            />
            <Input
              aria-label={`Amount for ${line.label || 'this line'}`}
              type="number"
              inputMode="decimal"
              value={Number.isFinite(line.amount) && line.amount !== 0 ? line.amount : ''}
              placeholder="0"
              onChange={(event) => setLine(key, line.id, { amount: Number(event.target.value) || 0 })}
              className="figure h-9 rounded-lg"
            />
            <Button type="button" variant="ghost" size="icon-sm" className="self-center" aria-label={`Remove ${line.label || 'this line'}`} onClick={() => removeLine(key, line.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" className="justify-self-start rounded-full" onClick={() => addLine(key)}>
          <Plus />
          {addLabel}
        </Button>
      </div>
    )
  }

  function numberRow(key: NumberKey, label: string, hint?: string) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_8.5rem_2rem] items-center gap-2">
        <span className="text-sm">
          {label}
          {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
        </span>
        <Input
          aria-label={label}
          type="number"
          inputMode="decimal"
          value={s[key] || ''}
          placeholder="0"
          onChange={(event) => setNumber(key, Number(event.target.value) || 0)}
          className="figure h-9 rounded-lg"
        />
      </div>
    )
  }

  const total = (label: string, value: number, strong = false) => (
    <div className={cn('flex justify-between gap-3 border-t pt-2 text-sm', strong && 'font-semibold')}>
      <span>{label}</span>
      <span className={cn('figure', value < 0 && 'text-loss')}>{format(value)}</span>
    </div>
  )

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl border-0 py-5">
        <CardContent className="grid gap-4 px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Field>
            <FieldLabel>Business name</FieldLabel>
            <Input value={s.company} maxLength={80} placeholder="e.g. My online shop" onChange={(e) => setS({ ...s, company: e.target.value })} className="h-10 rounded-xl" />
          </Field>
          <Field>
            <FieldLabel>Period</FieldLabel>
            <Input value={s.period} maxLength={60} placeholder="e.g. Year to 31 Dec 2026" onChange={(e) => setS({ ...s, period: e.target.value })} className="h-10 rounded-xl" />
          </Field>
          <Field>
            <FieldLabel>Currency</FieldLabel>
            <ToggleGroup variant="outline" spacing={0} value={[s.currency]} onValueChange={(v) => v[0] && setS({ ...s, currency: v[0] as Statements['currency'] })}>
              <ToggleGroupItem value="PHP" className="h-10 px-4 aria-pressed:bg-primary/10">₱</ToggleGroupItem>
              <ToggleGroupItem value="USD" className="h-10 px-4 aria-pressed:bg-primary/10">$</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <div className="flex flex-wrap items-center gap-2 md:col-span-3">
            <Button type="button" variant="outline" className="rounded-full" data-tut="statements.sample" onClick={loadSample}>
              <FileText />
              Load the sample
            </Button>
            <Button type="button" variant="ghost" className="rounded-full" onClick={startOver}>
              <RotateCcw />
              Start over
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button className="rounded-full" data-tut="statements.export" />}>
                <Download />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => exportAs('csv')}>CSV (spreadsheet)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAs('html')}>HTML report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {notice ? <p className="text-xs text-muted-foreground" role="status">{notice}</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-3" data-tut="statements.checks">
        <Check ok label="Net income" detail={format(t.netIncome)} neutral />
        <Check ok={t.balances} label="Assets = liabilities + equity" detail={t.balances ? 'Balances' : `Off by ${format(t.balanceGap)}`} />
        <Check ok={t.cashTies} label="Cash flow ends on balance-sheet cash" detail={t.cashTies ? 'Ties' : `Off by ${format(t.cashGap)}`} />
      </div>

      <Tabs defaultValue="income">
        <TabsList className="mb-3 w-full sm:w-auto" data-tut="statements.tabs">
          <TabsTrigger value="income">Income statement</TabsTrigger>
          <TabsTrigger value="balance">Balance sheet</TabsTrigger>
          <TabsTrigger value="cash">Cash flow</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <StatementCard title="Income statement" description="What the business earned and spent over the period.">
            <Section title="Revenue">{lineList('revenue', 'Add revenue')}{total('Total revenue', t.revenue)}</Section>
            <Section title="Expenses">{lineList('expenses', 'Add an expense')}{total('Total expenses', t.expenses)}</Section>
            {total('Net income', t.netIncome, true)}
          </StatementCard>
        </TabsContent>

        <TabsContent value="balance">
          <StatementCard title="Balance sheet" description="What the business owns and owes at the end of the period.">
            <Section title="Assets">
              {numberRow('cash', 'Cash', 'Must match the closing cash on the cash-flow tab.')}
              {lineList('assets', 'Add an asset')}
              {total('Total assets', t.assets)}
            </Section>
            <Section title="Liabilities">{lineList('liabilities', 'Add a liability')}{total('Total liabilities', t.liabilities)}</Section>
            <Section title="Equity">
              {numberRow('capital', 'Capital put in')}
              {numberRow('openingRetained', 'Retained earnings at the start')}
              {numberRow('dividends', 'Dividends or owner’s drawings')}
              <div className="flex justify-between gap-3 text-sm">
                <span>
                  Retained earnings at the end
                  <span className="block text-xs text-muted-foreground">Start + net income − drawings</span>
                </span>
                <span className="figure">{format(t.retainedEarnings)}</span>
              </div>
              {total('Total equity', t.equity)}
            </Section>
            {total('Liabilities + equity', t.liabilities + t.equity, true)}
          </StatementCard>
        </TabsContent>

        <TabsContent value="cash">
          <StatementCard title="Cash flow" description="Where cash came from and went. Money in is positive, money out negative.">
            <Section title="Operating">
              <div className="flex justify-between gap-3 text-sm">
                <span>Net income <span className="text-xs text-muted-foreground">(from the income statement)</span></span>
                <span className="figure">{format(t.netIncome)}</span>
              </div>
              {lineList('operating', 'Add an adjustment')}
              {total('Cash from operations', t.operating)}
            </Section>
            <Section title="Investing">{lineList('investing', 'Add an investing item')}{total('Cash from investing', t.investing)}</Section>
            <Section title="Financing">{lineList('financing', 'Add a financing item')}{total('Cash from financing', t.financing)}</Section>
            <Section title="Cash">
              {numberRow('openingCash', 'Cash at the start')}
              {total('Cash at the end', t.closingCash, true)}
            </Section>
          </StatementCard>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        Kept only in this browser and cleared after five days without an edit. Nothing is uploaded. A learning tool,
        not an audited statement.
      </p>
    </div>
  )
}

function Check({ ok, label, detail, neutral = false }: { ok: boolean; label: string; detail: string; neutral?: boolean }) {
  const Icon = ok ? CircleCheck : CircleAlert
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl p-3 ring-1', neutral ? 'bg-muted/50 ring-border' : ok ? 'bg-gain/10 ring-gain/30' : 'bg-loss/10 ring-loss/30')}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', neutral ? 'text-muted-foreground' : ok ? 'text-gain' : 'text-loss')} />
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="figure block truncate text-sm font-semibold">{detail}</span>
      </span>
    </div>
  )
}

function StatementCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-0 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-3xl gap-5 px-5">{children}</CardContent>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}
