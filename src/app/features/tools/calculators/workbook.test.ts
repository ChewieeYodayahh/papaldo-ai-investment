import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { sampleStatements, totals } from './statements'
import { budgetSheet, FOOTER, SHEET_NAMES, statementSheets, type XSheet } from './workbook'
import { renderWorkbook } from './workbook-render'

/**
 * A tiny evaluator for the formulas the layouts use: numbers, cell refs
 * (optionally 'Sheet'!C5), SUM(B3:B9), + - *. Enough to prove the exported
 * totals equal the app's.
 */
function evaluate(sheets: XSheet[]) {
  const byName = new Map(sheets.map((sheet) => [sheet.name, sheet]))
  const value = (sheetName: string, ref: string): number => {
    const match = /^([A-Z])(\d+)$/.exec(ref)
    if (!match) throw new Error(`bad ref ${ref}`)
    const sheet = byName.get(sheetName)
    if (!sheet) throw new Error(`no sheet ${sheetName}`)
    const cell = sheet.rows[Number(match[2]) - 1]?.[match[1].charCodeAt(0) - 65]
    if (!cell) return 0
    if (cell.f) return formula(sheetName, cell.f)
    return typeof cell.v === 'number' ? cell.v : 0
  }
  const formula = (sheetName: string, text: string): number => {
    let expr = text.replace(/SUM\(([A-Z])(\d+):([A-Z])(\d+)\)/g, (_m, col: string, from: string, _c2: string, to: string) => {
      let total = 0
      for (let r = Number(from); r <= Number(to); r++) total += value(sheetName, `${col}${r}`)
      return `(${total})`
    })
    expr = expr.replace(/(?:'((?:[^']|'')+)'!)?\b([A-Z]\d+)\b/g, (_m, sheet: string | undefined, ref: string) =>
      `(${value(sheet ? sheet.replace(/''/g, "'") : sheetName, ref)})`,
    )
    if (!/^[\d\s().+\-*]+$/.test(expr)) throw new Error(`cannot evaluate ${text}`)
    return Function(`return (${expr})`)() as number
  }
  return (sheetName: string, label: string) => {
    const sheet = byName.get(sheetName)!
    const row = sheet.rows.findIndex((cells) => cells[0]?.v === label)
    if (row < 0) throw new Error(`no row "${label}" on ${sheetName}`)
    return value(sheetName, `C${row + 1}`)
  }
}

describe('statement workbook', () => {
  const s = sampleStatements()
  const t = totals(s)

  it('exports all three sheets in order, each ending on the footer', () => {
    const sheets = statementSheets(s, 'all')
    expect(sheets.map((sheet) => sheet.name)).toEqual([SHEET_NAMES.cash, SHEET_NAMES.balance, SHEET_NAMES.income])
    for (const sheet of sheets) expect(sheet.rows.at(-1)?.[0]?.v).toBe(FOOTER)
  })

  it('computes, through its formulas, the same totals as the app', () => {
    const read = evaluate(statementSheets(s, 'all'))
    expect(read(SHEET_NAMES.income, 'Net income')).toBe(t.netIncome)
    expect(read(SHEET_NAMES.balance, 'Total assets')).toBe(t.assets)
    expect(read(SHEET_NAMES.balance, 'Total liabilities and equity')).toBe(t.liabilities + t.equity)
    expect(read(SHEET_NAMES.balance, 'Check: assets minus the line above (should be 0)')).toBe(0)
    expect(read(SHEET_NAMES.cash, 'Total inflows') + read(SHEET_NAMES.cash, 'Total outflows')).toBe(t.netChange)
    expect(read(SHEET_NAMES.cash, 'Ending cash balance')).toBe(t.closingCash)
  })

  it('links net income to the income sheet when all are exported, and carries the figure when alone', () => {
    const linked = statementSheets(s, 'all')[1].rows.flat().some((cell) => cell.f?.startsWith("'Income Sheet'!C"))
    expect(linked).toBe(true)
    const [alone] = statementSheets(s, 'balance')
    expect(alone.rows.flat().some((cell) => cell.f?.includes('!'))).toBe(false)
    expect(evaluate([alone])(SHEET_NAMES.balance, 'Check: assets minus the line above (should be 0)')).toBe(0)
  })

  it('uses the non-profit names when asked', () => {
    const [income] = statementSheets({ ...s, nonProfit: true }, 'income')
    expect(income.rows[1][0].v).toBe('Statement of Activities')
    const [balance] = statementSheets({ ...s, nonProfit: true }, 'balance')
    expect(balance.rows.flat().some((cell) => cell.v === 'Total net assets')).toBe(true)
  })

  it('renders a real .xlsx that Excel can read back', async () => {
    const workbook = await renderWorkbook(statementSheets(s, 'all'), 'PHP')
    const buffer = await workbook.xlsx.writeBuffer()
    const back = new ExcelJS.Workbook()
    await back.xlsx.load(buffer as ArrayBuffer)
    expect(back.worksheets.map((sheet) => sheet.name)).toEqual(['Cash Flow', 'Balance Sheet', 'Income Sheet'])
    const cash = back.getWorksheet('Cash Flow')!
    const ending = cash.getColumn(1).values.findIndex((v) => v === 'Ending cash balance')
    expect((cash.getCell(`C${ending}`).value as { formula: string }).formula).toMatch(/^C\d+\+C\d+\+C\d+$/)
    expect(cash.getCell(`C${ending}`).numFmt).toContain('₱')
  })
})

describe('budget workbook', () => {
  it('totals each bucket with SUMIF against 50/30/20 targets of the pay cell', () => {
    const sheet = budgetSheet(
      40_000,
      [
        { id: 'a', label: 'Rent', bucket: 'needs', amount: 15_000 },
        { id: 'b', label: 'Milk tea', bucket: 'wants', amount: 2_000 },
      ],
      'PHP',
    )
    const formulas = sheet.rows.flat().flatMap((cell) => (cell.f ? [cell.f] : []))
    expect(formulas.some((f) => f.startsWith('SUMIF(B') && f.includes('"Needs"'))).toBe(true)
    expect(formulas.filter((f) => /^C\d+\*0\.[235]$/.test(f))).toHaveLength(3)
    expect(sheet.rows.at(-1)?.[0]?.v).toMatch(/Papaldo Ka by David Jamandre/)
  })
})
