/**
 * The three financial statements (Carlos, 2026-09-30; the vault page
 * "three-financial-statements"): an income statement, a balance sheet and a
 * cash-flow statement that tie together. Pure, so the ties are unit tested.
 *
 *   net income         revenue - expenses
 *   retained earnings  opening + net income - dividends or drawings
 *   the balance        assets = liabilities + equity
 *   the cash tie       opening cash + operating + investing + financing
 *                      = the cash on the balance sheet
 */

export type Line = { id: string; label: string; amount: number }

export type Statements = {
  company: string
  period: string
  currency: 'PHP' | 'USD'
  /**
   * A non-profit (a student council, a foundation): the statements take their
   * non-profit names -- Statement of Activities, Statement of Financial
   * Position, net assets instead of equity (2026-09-30). The maths is the same.
   */
  nonProfit?: boolean
  revenue: Line[]
  expenses: Line[]
  /** Balance-sheet cash, the figure the cash-flow statement must end on. */
  cash: number
  /** Assets other than cash. */
  assets: Line[]
  liabilities: Line[]
  /** Owner's or share capital. */
  capital: number
  openingRetained: number
  dividends: number
  openingCash: number
  /** Non-cash items and working-capital changes added to net income. */
  operating: Line[]
  investing: Line[]
  financing: Line[]
}

export type StatementTotals = {
  revenue: number
  expenses: number
  netIncome: number
  retainedEarnings: number
  equity: number
  assets: number
  liabilities: number
  /** Assets minus (liabilities + equity): zero when the balance sheet balances. */
  balanceGap: number
  operating: number
  investing: number
  financing: number
  netChange: number
  closingCash: number
  /** Closing cash from the cash flow minus balance-sheet cash: zero when they tie. */
  cashGap: number
  balances: boolean
  cashTies: boolean
}

const sum = (lines: Line[]) => lines.reduce((total, line) => total + (Number.isFinite(line.amount) ? line.amount : 0), 0)
/** Half a centavo: anything smaller is rounding, not an error. */
const TOLERANCE = 0.005

export function totals(s: Statements): StatementTotals {
  const revenue = sum(s.revenue)
  const expenses = sum(s.expenses)
  const netIncome = revenue - expenses
  const retainedEarnings = s.openingRetained + netIncome - s.dividends
  const equity = s.capital + retainedEarnings
  const assets = s.cash + sum(s.assets)
  const liabilities = sum(s.liabilities)
  const operating = netIncome + sum(s.operating)
  const investing = sum(s.investing)
  const financing = sum(s.financing)
  const netChange = operating + investing + financing
  const closingCash = s.openingCash + netChange
  const balanceGap = assets - (liabilities + equity)
  const cashGap = closingCash - s.cash
  return {
    revenue,
    expenses,
    netIncome,
    retainedEarnings,
    equity,
    assets,
    liabilities,
    balanceGap,
    operating,
    investing,
    financing,
    netChange,
    closingCash,
    cashGap,
    balances: Math.abs(balanceGap) < TOLERANCE,
    cashTies: Math.abs(cashGap) < TOLERANCE,
  }
}

let counter = 0
export const lineId = () => `l${Date.now().toString(36)}${(counter++).toString(36)}`
const lines = (entries: Array<[string, number]>): Line[] => entries.map(([label, amount]) => ({ id: lineId(), label, amount }))

export function emptyStatements(currency: Statements['currency'] = 'PHP'): Statements {
  return {
    company: '',
    period: '',
    currency,
    nonProfit: false,
    revenue: lines([['Sales', 0]]),
    expenses: lines([['Cost of goods sold', 0]]),
    cash: 0,
    assets: lines([['Inventory', 0]]),
    liabilities: lines([['Accounts payable', 0]]),
    capital: 0,
    openingRetained: 0,
    dividends: 0,
    openingCash: 0,
    operating: lines([['Depreciation', 0]]),
    investing: lines([['Equipment bought', 0]]),
    financing: lines([['Loan received', 0]]),
  }
}

/** A small sari-sari store's year, worked so every statement ties. */
export function sampleStatements(): Statements {
  return {
    company: 'Aling Nena’s Sari-Sari Store',
    period: 'Year to 31 Dec 2026',
    currency: 'PHP',
    nonProfit: false,
    revenue: lines([
      ['Sales', 480_000],
      ['Load and bills-payment commissions', 5_000],
    ]),
    expenses: lines([
      ['Cost of goods sold', 300_000],
      ['Rent', 36_000],
      ['Electricity and water', 18_000],
      ['Helper’s wages', 60_000],
      ['Depreciation (freezer, shelves)', 10_000],
    ]),
    cash: 100_000,
    assets: lines([
      ['Inventory', 45_000],
      ['Utang (customer credit)', 6_000],
      ['Equipment, after depreciation', 90_000],
    ]),
    liabilities: lines([
      ['Owed to suppliers', 20_000],
      ['Bank loan', 50_000],
    ]),
    capital: 100_000,
    openingRetained: 40_000,
    dividends: 30_000,
    openingCash: 40_000,
    operating: lines([
      ['Add back depreciation', 10_000],
      ['More inventory on hand', -5_000],
      ['More customer credit', -1_000],
      ['More owed to suppliers', 4_000],
    ]),
    investing: lines([['New freezer', -20_000]]),
    financing: lines([
      ['Bank loan received', 41_000],
      ['Owner’s drawings', -30_000],
    ]),
  }
}

/** Drafts live only in this browser and clear after five days without an edit (Carlos, 2026-09-30). */
export const DRAFT_KEY = 'papaldo-statements-draft'
export const DRAFT_TTL_MS = 5 * 24 * 60 * 60 * 1000

type Draft = { version: 1; lastEditedAt: number; data: Statements }

export function serializeDraft(data: Statements, now: number): string {
  return JSON.stringify({ version: 1, lastEditedAt: now, data } satisfies Draft)
}

/** The saved draft, or null when there is none, it is unreadable, or it expired. */
export function parseDraft(raw: string | null, now: number): { data: Statements; lastEditedAt: number } | { expired: true } | null {
  if (!raw) return null
  try {
    const draft = JSON.parse(raw) as Partial<Draft>
    if (draft.version !== 1 || typeof draft.lastEditedAt !== 'number' || !draft.data) return null
    if (now - draft.lastEditedAt > DRAFT_TTL_MS) return { expired: true }
    return { data: draft.data, lastEditedAt: draft.lastEditedAt }
  } catch {
    return null
  }
}

/** Every line of all three statements as rows: statement, section, item, amount. */
export function statementRows(s: Statements): Array<[string, string, string, number]> {
  const t = totals(s)
  const is = 'Income statement'
  const bs = 'Balance sheet'
  const cf = 'Cash flow'
  return [
    ...s.revenue.map((l): [string, string, string, number] => [is, 'Revenue', l.label, l.amount]),
    [is, 'Revenue', 'Total revenue', t.revenue],
    ...s.expenses.map((l): [string, string, string, number] => [is, 'Expenses', l.label, l.amount]),
    [is, 'Expenses', 'Total expenses', t.expenses],
    [is, 'Result', 'Net income', t.netIncome],
    [bs, 'Assets', 'Cash', s.cash],
    ...s.assets.map((l): [string, string, string, number] => [bs, 'Assets', l.label, l.amount]),
    [bs, 'Assets', 'Total assets', t.assets],
    ...s.liabilities.map((l): [string, string, string, number] => [bs, 'Liabilities', l.label, l.amount]),
    [bs, 'Liabilities', 'Total liabilities', t.liabilities],
    [bs, 'Equity', 'Capital', s.capital],
    [bs, 'Equity', 'Retained earnings', t.retainedEarnings],
    [bs, 'Equity', 'Total equity', t.equity],
    [cf, 'Operating', 'Net income', t.netIncome],
    ...s.operating.map((l): [string, string, string, number] => [cf, 'Operating', l.label, l.amount]),
    [cf, 'Operating', 'Cash from operations', t.operating],
    ...s.investing.map((l): [string, string, string, number] => [cf, 'Investing', l.label, l.amount]),
    [cf, 'Investing', 'Cash from investing', t.investing],
    ...s.financing.map((l): [string, string, string, number] => [cf, 'Financing', l.label, l.amount]),
    [cf, 'Financing', 'Cash from financing', t.financing],
    [cf, 'Cash', 'Opening cash', s.openingCash],
    [cf, 'Cash', 'Closing cash', t.closingCash],
  ]
}

/** What each statement and figure is called, for a business or a non-profit. */
export function statementLabels(nonProfit = false) {
  return nonProfit
    ? {
        income: 'Statement of Activities',
        balance: 'Statement of Financial Position',
        cash: 'Statement of Cash Flows',
        revenue: 'Revenue and support',
        expenses: 'Expenses',
        netIncome: 'Change in net assets (surplus or deficit)',
        equity: 'Net assets',
        capital: 'Net assets with donor restrictions',
        openingRetained: 'Net assets without donor restrictions, at the start',
        dividends: 'Transfers out',
        retainedEnd: 'Net assets without donor restrictions, at the end',
      }
    : {
        income: 'Income Statement',
        balance: 'Balance Sheet',
        cash: 'Statement of Cash Flows',
        revenue: 'Revenue',
        expenses: 'Expenses',
        netIncome: 'Net income',
        equity: 'Equity',
        capital: 'Capital put in',
        openingRetained: 'Retained earnings at the start',
        dividends: 'Dividends or owner’s drawings',
        retainedEnd: 'Retained earnings at the end',
      }
}
