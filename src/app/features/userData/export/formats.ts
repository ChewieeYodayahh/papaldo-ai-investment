/**
 * File builders for the export engine. Everything runs in the browser; the
 * files go straight to the viewer's downloads and nothing is uploaded or
 * kept on the server (Carlos, 2026-09-29).
 */

export type Column<Row> = { id: string; label: string; value: (row: Row) => string | number | null }

export type Table = { title: string; headers: string[]; rows: Array<Array<string | number | null>> }

/** RFC 4180 quoting: fields with a comma, quote or newline are wrapped and quotes doubled. */
export function csvCell(value: string | number | null): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  // A leading =, +, - or @ makes spreadsheets run the cell as a formula; a
  // quote in front keeps a name like "=cmd" as text (CSV injection).
  const safe = /^[=+\-@]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(table: Table): string {
  const lines = [table.headers, ...table.rows].map((row) => row.map(csvCell).join(','))
  // The byte-order mark makes Excel read the file as UTF-8 (₱, é, …).
  return `﻿${lines.join('\r\n')}\r\n`
}

export function tableFrom<Row>(title: string, columns: Column<Row>[], rows: Row[]): Table {
  return { title, headers: columns.map((c) => c.label), rows: rows.map((row) => columns.map((c) => c.value(row))) }
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A small line chart as inline SVG, so the report needs no scripts or network. */
export function sparklineSvg(values: number[], width = 720, height = 180): string {
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / (values.length - 1)
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 16) - 8).toFixed(1)}`)
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Account value over time"><polyline fill="none" stroke="#2f9e5a" stroke-width="2.5" points="${points.join(' ')}"/></svg>`
}

export type ReportSection = { title: string; intro?: string; stats?: Array<{ label: string; value: string }>; table?: Table; chart?: string }

/**
 * One self-contained HTML file: inline styles, no scripts, prints cleanly.
 * The report has its own fixed light styling so it reads the same wherever
 * it is opened or printed, whatever theme the app was in.
 */
export function htmlReport(title: string, subtitle: string, sections: ReportSection[], footer: string): string {
  const body = sections
    .map((section) => {
      const stats = section.stats?.length
        ? `<div class="stats">${section.stats
            .map((s) => `<div class="stat"><span>${escapeHtml(s.label)}</span><strong>${escapeHtml(s.value)}</strong></div>`)
            .join('')}</div>`
        : ''
      const table = section.table
        ? `<div class="scroll"><table><thead><tr>${section.table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${section.table.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell === null ? '' : String(cell))}</td>`).join('')}</tr>`)
            .join('')}</tbody></table></div>`
        : ''
      return `<section><h2>${escapeHtml(section.title)}</h2>${section.intro ? `<p class="muted">${escapeHtml(section.intro)}</p>` : ''}${stats}${section.chart ?? ''}${table}</section>`
    })
    .join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#17241a;background:#f6f9f5;margin:0;padding:32px 20px;line-height:1.5}
main{max-width:1040px;margin:0 auto}
h1{font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:0 0 12px}
.muted{color:#56665a;margin:0 0 12px}
section{background:#fff;border:1px solid #dde6dc;border-radius:16px;padding:20px;margin:16px 0}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:12px}
.stat{background:#edf3ec;border-radius:12px;padding:10px 12px}.stat span{display:block;font-size:12px;color:#56665a}.stat strong{font-size:18px;font-variant-numeric:tabular-nums}
.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px;font-variant-numeric:tabular-nums}
th{text-align:left;font-size:11px;letter-spacing:.06em;color:#56665a;border-bottom:1px solid #c9d6c8;padding:8px}
td{border-bottom:1px solid #eef3ed;padding:8px;white-space:nowrap}
footer{font-size:12px;color:#56665a;margin-top:24px}
@media print{body{background:#fff;padding:0}section{break-inside:avoid;border-color:#ccc}}
</style></head>
<body><main><h1>${escapeHtml(title)}</h1><p class="muted">${escapeHtml(subtitle)}</p>${body}<footer>${escapeHtml(footer)}</footer></main></body></html>`
}

/** Saves text as a file in the browser. */
export function downloadText(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
