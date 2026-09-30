/**
 * Turns `workbook.ts` layouts into a real .xlsx with ExcelJS. The library is
 * about 1 MB, so it is imported only when someone exports. Nothing leaves
 * the browser: the file is built in memory and downloaded.
 *
 * Colours here are the spreadsheet's own (the USC statement's yellow title,
 * green inflows and red outflows), not the app theme: a file opened in Excel
 * or printed has no light or dark mode.
 */

import type { Borders, Fill, Font, Workbook } from 'exceljs'

import type { XSheet, XStyle } from './workbook'

const SOLID = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const THIN = { style: 'thin' as const, color: { argb: 'FF9AA59C' } }

type Look = { font?: Partial<Font>; fill?: Fill; money?: boolean; percent?: boolean; indent?: number; border?: Partial<Borders>; align?: 'center' | 'left' | 'right' }

const LOOKS: Record<XStyle, Look> = {
  title: { font: { bold: true, size: 12 }, fill: SOLID('FFFFD966'), align: 'center' },
  subtitle: { font: { bold: true, size: 11 }, fill: SOLID('FFFFD966'), align: 'center' },
  'band-in': { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: SOLID('FF6AA84F'), align: 'center' },
  'band-out': { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: SOLID('FFCC0000'), align: 'center' },
  band: { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: SOLID('FF3D4F43'), align: 'center' },
  section: { font: { size: 11 } },
  item: { indent: 2 },
  money: { money: true },
  'money-last': { money: true, border: { bottom: THIN } },
  'label-bold': { font: { bold: true } },
  'total-in': { font: { bold: true }, fill: SOLID('FFD9EAD3') },
  'total-in-money': { font: { bold: true }, fill: SOLID('FFD9EAD3'), money: true },
  'total-out': { font: { bold: true }, fill: SOLID('FFF4CCCC') },
  'total-out-money': { font: { bold: true }, fill: SOLID('FFF4CCCC'), money: true },
  total: { font: { bold: true }, fill: SOLID('FFE7ECE8') },
  'total-money': { font: { bold: true }, money: true },
  grand: { font: { bold: true } },
  'grand-money': { font: { bold: true }, fill: SOLID('FFFFFF00'), money: true },
  percent: { percent: true },
  header: { font: { bold: true }, border: { bottom: THIN } },
  note: { font: { italic: true, size: 9, color: { argb: 'FF6B7A6E' } } },
  footer: { font: { italic: true, size: 9, color: { argb: 'FF6B7A6E' } }, align: 'left' },
}

/** ₱1,000.00 and ₱(1,000.00) for negatives, as on the USC statement. */
function moneyFormat(currency: 'PHP' | 'USD') {
  const sign = currency === 'PHP' ? '"₱"' : '"$"'
  return `${sign}#,##0.00;${sign}(#,##0.00);${sign}0.00`
}

export async function renderWorkbook(sheets: XSheet[], currency: 'PHP' | 'USD'): Promise<Workbook> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Papaldo Ka'
  workbook.created = new Date()
  // Open with every formula computed (none carry a cached result).
  workbook.calcProperties.fullCalcOnLoad = true

  for (const layout of sheets) {
    const sheet = workbook.addWorksheet(layout.name, { views: [{ showGridLines: false }], pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 } })
    sheet.columns = layout.widths.map((width) => ({ width }))
    const columns = layout.widths.length

    layout.rows.forEach((cells, index) => {
      const rowNumber = index + 1
      const row = sheet.getRow(rowNumber)
      cells.forEach((cell, column) => {
        const target = row.getCell(column + 1)
        if (cell.f) target.value = { formula: cell.f }
        else if (cell.v !== undefined) target.value = cell.v
        const look = cell.s ? LOOKS[cell.s] : undefined
        if (!look) return
        if (look.font) target.font = { name: 'Calibri', size: 11, ...look.font }
        if (look.fill) target.fill = look.fill
        if (look.border) target.border = look.border
        if (look.money) target.numFmt = moneyFormat(currency)
        if (look.percent) target.numFmt = '0.0%'
        target.alignment = { horizontal: look.align ?? (look.money || look.percent ? 'right' : 'left'), vertical: 'middle', indent: look.indent }
      })
      if (layout.spans.includes(rowNumber)) {
        sheet.mergeCells(rowNumber, 1, rowNumber, columns)
        const look = LOOKS[cells[0]?.s ?? 'item']
        // A merged band is filled across the full width.
        if (look.fill) for (let c = 2; c <= columns; c++) row.getCell(c).fill = look.fill
      }
    })
  }
  return workbook
}

export async function downloadWorkbook(sheets: XSheet[], currency: 'PHP' | 'USD', filename: string) {
  const workbook = await renderWorkbook(sheets, currency)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
