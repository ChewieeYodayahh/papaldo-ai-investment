/**
 * Excel layouts for the financial statements and the budget (Carlos,
 * 2026-09-30), as plain data: cells, formulas and style names. Kept free of
 * the Excel library so the layout -- and every formula in it -- is unit
 * tested; `workbook-render.ts` turns it into an .xlsx in the browser.
 *
 * The cash-flow sheet follows the UP Cebu University Student Council's
 * "Statement of Cash Flows" (vault, 2026-09-30): a title block, beginning
 * cash, an Inflows band and an Outflows band grouped by activity, totals,
 * and the ending cash highlighted. Totals are formulas, so a figure changed
 * in Excel carries through, and across sheets when all three are exported.
 */

import { BUCKETS, TARGET_SHARE, type BudgetLine, type Bucket } from './budget'
import { statementLabels, totals, type Line, type Statements } from './statements'

export type XStyle =
  | 'title'
  | 'subtitle'
  | 'band-in'
  | 'band-out'
  | 'band'
  | 'section'
  | 'item'
  | 'money'
  | 'money-last'
  | 'label-bold'
  | 'total-in'
  | 'total-in-money'
  | 'total-out'
  | 'total-out-money'
  | 'total'
  | 'total-money'
  | 'grand'
  | 'grand-money'
  | 'percent'
  | 'header'
  | 'note'
  | 'footer'

export type XCell = { v?: string | number; f?: string; s?: XStyle }
export type XRow = XCell[]
export type XSheet = {
  name: string
  /** Column widths in characters, A onwards. */
  widths: number[]
  rows: XRow[]
  /** Rows (1-based) whose first cell spans every column. */
  spans: number[]
}

export const FOOTER = 'Statement from Papaldo Ka by David Jamandre'
export const SHEET_NAMES = { cash: 'Cash Flow', balance: 'Balance Sheet', income: 'Income Sheet' } as const
export type StatementSheet = keyof typeof SHEET_NAMES

/** Builds a sheet row by row, remembering where each row landed for formulas. */
class SheetBuilder {
  rows: XRow[] = []
  spans: number[] = []
  add(row: XRow): number {
    this.rows.push(row)
    return this.rows.length
  }
  span(text: string, s: XStyle): number {
    const at = this.add([{ v: text, s }])
    this.spans.push(at)
    return at
  }
  blank(): number {
    return this.add([])
  }
}

const sumOf = (column: string, from: number, to: number) => (to >= from ? `SUM(${column}${from}:${column}${to})` : '0')
const q = (sheet: string) => `'${sheet.replace(/'/g, "''")}'`

function titleBlock(b: SheetBuilder, s: Statements, statement: string) {
  b.span(s.company || 'Your organisation', 'title')
  b.span(statement, 'title')
  b.span(s.period || 'For the period', 'subtitle')
  b.blank()
}

function footer(b: SheetBuilder) {
  b.blank()
  b.span(FOOTER, 'footer')
}

/** Net income on the income sheet: row number of the cell in column C. */
export function incomeSheet(s: Statements): { sheet: XSheet; netIncomeRow: number } {
  const labels = statementLabels(s.nonProfit)
  const b = new SheetBuilder()
  titleBlock(b, s, labels.income)

  b.span(labels.revenue, 'band-in')
  const revFirst = b.rows.length + 1
  for (const line of s.revenue) b.add([{ v: line.label, s: 'item' }, { v: line.amount, s: 'money' }])
  const revLast = b.rows.length
  const revTotal = b.add([{ v: `Total ${labels.revenue.toLowerCase()}`, s: 'total-in' }, { s: 'total-in' }, { f: sumOf('B', revFirst, revLast), s: 'total-in-money' }])
  b.blank()

  b.span(labels.expenses, 'band-out')
  const expFirst = b.rows.length + 1
  for (const line of s.expenses) b.add([{ v: line.label, s: 'item' }, { v: line.amount, s: 'money' }])
  const expLast = b.rows.length
  const expTotal = b.add([{ v: 'Total expenses', s: 'total-out' }, { s: 'total-out' }, { f: sumOf('B', expFirst, expLast), s: 'total-out-money' }])
  b.blank()

  const netIncomeRow = b.add([{ v: labels.netIncome, s: 'grand' }, { s: 'grand' }, { f: `C${revTotal}-C${expTotal}`, s: 'grand-money' }])
  footer(b)
  return { sheet: { name: SHEET_NAMES.income, widths: [48, 18, 20], rows: b.rows, spans: b.spans }, netIncomeRow }
}

/** `netIncome` is a formula into the income sheet, or the figure itself when exported alone. */
export function balanceSheet(s: Statements, netIncome: XCell): XSheet {
  const labels = statementLabels(s.nonProfit)
  const b = new SheetBuilder()
  titleBlock(b, s, labels.balance)

  b.span('Assets', 'band-in')
  const assetFirst = b.add([{ v: 'Cash', s: 'item' }, { v: s.cash, s: 'money' }])
  for (const line of s.assets) b.add([{ v: line.label, s: 'item' }, { v: line.amount, s: 'money' }])
  const assetTotal = b.add([{ v: 'Total assets', s: 'total-in' }, { s: 'total-in' }, { f: sumOf('B', assetFirst, b.rows.length), s: 'total-in-money' }])
  b.blank()

  b.span('Liabilities', 'band-out')
  const liabFirst = b.rows.length + 1
  for (const line of s.liabilities) b.add([{ v: line.label, s: 'item' }, { v: line.amount, s: 'money' }])
  const liabTotal = b.add([{ v: 'Total liabilities', s: 'total-out' }, { s: 'total-out' }, { f: sumOf('B', liabFirst, b.rows.length), s: 'total-out-money' }])
  b.blank()

  b.span(labels.equity, 'band')
  const eqFirst = b.add([{ v: labels.capital, s: 'item' }, { v: s.capital, s: 'money' }])
  b.add([{ v: labels.openingRetained, s: 'item' }, { v: s.openingRetained, s: 'money' }])
  b.add([{ v: labels.netIncome, s: 'item' }, { ...netIncome, s: 'money' }])
  const eqLast = b.add([{ v: `Less ${labels.dividends.toLowerCase()}`, s: 'item' }, { v: -s.dividends, s: 'money' }])
  const eqTotal = b.add([{ v: `Total ${labels.equity.toLowerCase()}`, s: 'total' }, { s: 'total' }, { f: sumOf('B', eqFirst, eqLast), s: 'total-money' }])
  b.blank()

  const both = b.add([
    { v: `Total liabilities and ${labels.equity.toLowerCase()}`, s: 'grand' },
    { s: 'grand' },
    { f: `C${liabTotal}+C${eqTotal}`, s: 'grand-money' },
  ])
  b.add([{ v: 'Check: assets minus the line above (should be 0)', s: 'note' }, {}, { f: `C${assetTotal}-C${both}`, s: 'money' }])
  footer(b)
  return { name: SHEET_NAMES.balance, widths: [48, 18, 20], rows: b.rows, spans: b.spans }
}

type Flow = { activity: 'Operating' | 'Investing' | 'Financing'; label: string; cell: XCell; amount: number }

/**
 * Every cash-flow line, split into money in and money out like the USC
 * statement. Net income opens the operating lines (a formula into the
 * income sheet when there is one); positive lines are inflows, negative
 * ones outflows, shown in brackets.
 */
export function cashFlowSheet(s: Statements, netIncome: XCell): XSheet {
  const labels = statementLabels(s.nonProfit)
  const t = totals(s)
  const flows: Flow[] = [
    { activity: 'Operating' as const, label: labels.netIncome, cell: netIncome, amount: t.netIncome },
    ...s.operating.map((l: Line): Flow => ({ activity: 'Operating', label: l.label, cell: { v: l.amount }, amount: l.amount })),
    ...s.investing.map((l: Line): Flow => ({ activity: 'Investing', label: l.label, cell: { v: l.amount }, amount: l.amount })),
    ...s.financing.map((l: Line): Flow => ({ activity: 'Financing', label: l.label, cell: { v: l.amount }, amount: l.amount })),
  ].filter((flow) => flow.amount !== 0)

  const b = new SheetBuilder()
  titleBlock(b, s, labels.cash)
  const begin = b.add([{ v: 'Beginning cash balance', s: 'label-bold' }, {}, { v: s.openingCash, s: 'total-money' }])
  b.blank()

  const section = (title: string, band: XStyle, items: Flow[], totalStyle: 'in' | 'out') => {
    b.span(title, band)
    b.blank()
    let first = 0
    let last = 0
    for (const activity of ['Operating', 'Investing', 'Financing'] as const) {
      const group = items.filter((flow) => flow.activity === activity)
      if (group.length === 0) continue
      b.add([{ v: `${activity} activities`, s: 'section' }])
      group.forEach((flow) => {
        const row = b.add([{ v: flow.label, s: 'item' }, { ...flow.cell, s: 'money' }])
        first ||= row
        last = row
      })
    }
    if (last) b.rows[last - 1][1] = { ...b.rows[last - 1][1], s: 'money-last' }
    b.blank()
    return b.add([
      { v: totalStyle === 'in' ? 'Total inflows' : 'Total outflows', s: totalStyle === 'in' ? 'total-in' : 'total-out' },
      { s: totalStyle === 'in' ? 'total-in' : 'total-out' },
      { f: first ? sumOf('B', first, last) : '0', s: totalStyle === 'in' ? 'total-in-money' : 'total-out-money' },
    ])
  }

  const totalIn = section('Inflows', 'band-in', flows.filter((f) => f.amount > 0), 'in')
  b.blank()
  const totalOut = section('Outflows', 'band-out', flows.filter((f) => f.amount < 0), 'out')
  b.blank()
  b.add([{ v: 'Ending cash balance', s: 'label-bold' }, {}, { f: `C${begin}+C${totalIn}+C${totalOut}`, s: 'grand-money' }])
  footer(b)
  return { name: SHEET_NAMES.cash, widths: [48, 18, 20], rows: b.rows, spans: b.spans }
}

/**
 * The sheets to export, in Carlos's order: Cash Flow, Balance Sheet, Income
 * Sheet. With the income sheet included, net income elsewhere is a formula
 * pointing at it; exported alone, a sheet carries the figure instead.
 */
export function statementSheets(s: Statements, which: StatementSheet | 'all'): XSheet[] {
  const income = incomeSheet(s)
  const linked = which === 'all'
  const netIncome: XCell = linked ? { f: `${q(SHEET_NAMES.income)}!C${income.netIncomeRow}` } : { v: totals(s).netIncome }
  const all: Record<StatementSheet, XSheet> = {
    cash: cashFlowSheet(s, netIncome),
    balance: balanceSheet(s, netIncome),
    income: income.sheet,
  }
  return which === 'all' ? [all.cash, all.balance, all.income] : [all[which]]
}

const BUCKET_LABEL: Record<Bucket, string> = { needs: 'Needs', wants: 'Wants', savings: 'Savings & debt' }

/** The 50/30/20 budget as one sheet, with SUMIF totals against the targets. */
export function budgetSheet(pay: number, lines: BudgetLine[], currency: 'PHP' | 'USD'): XSheet {
  const b = new SheetBuilder()
  b.span('Budget 50/30/20', 'title')
  b.span(`Monthly take-home pay, ${currency}`, 'subtitle')
  b.blank()
  const payRow = b.add([{ v: 'Take-home pay', s: 'label-bold' }, {}, { v: pay, s: 'total-money' }, {}])
  b.blank()
  b.add([{ v: 'What for', s: 'header' }, { v: 'Kind', s: 'header' }, { v: 'Per month', s: 'header' }, {}])
  const first = b.rows.length + 1
  for (const line of lines) b.add([{ v: line.label || 'Unnamed', s: 'item' }, { v: BUCKET_LABEL[line.bucket], s: 'item' }, { v: line.amount, s: 'money' }, {}])
  const last = b.rows.length
  b.blank()
  b.add([{ v: 'Bucket', s: 'header' }, { v: 'Target', s: 'header' }, { v: 'Planned', s: 'header' }, { v: 'Share of pay', s: 'header' }])
  for (const bucket of BUCKETS) {
    const row = b.rows.length + 1
    b.add([
      { v: `${BUCKET_LABEL[bucket]} (${TARGET_SHARE[bucket] * 100}%)`, s: 'item' },
      { f: `C${payRow}*${TARGET_SHARE[bucket]}`, s: 'money' },
      { f: first <= last ? `SUMIF(B${first}:B${last},"${BUCKET_LABEL[bucket]}",C${first}:C${last})` : '0', s: 'money' },
      { f: `IF(C${payRow}=0,0,C${row}/C${payRow})`, s: 'percent' },
    ])
  }
  b.blank()
  b.add([{ v: 'Not yet planned', s: 'grand' }, { s: 'grand' }, { f: `C${payRow}-${sumOf('C', first, last)}`, s: 'grand-money' }, {}])
  b.blank()
  b.span('Budget from Papaldo Ka by David Jamandre', 'footer')
  return { name: 'Budget', widths: [40, 18, 18, 14], rows: b.rows, spans: b.spans }
}
