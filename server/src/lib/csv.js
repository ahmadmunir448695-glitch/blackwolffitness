/** CSV with a UTF-8 BOM so Excel opens names in any script correctly. */
export function toCsv(columns, rows) {
  const cell = (v) => {
    if (v === null || v === undefined) return ''
    let s = String(v)
    // Neutralise spreadsheet formula injection.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [columns.map((c) => cell(c.label)).join(',')]
  for (const row of rows) lines.push(columns.map((c) => cell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

export function sendCsv(res, filename, columns, rows) {
  res.set('Content-Type', 'text/csv; charset=utf-8')
  res.set('Content-Disposition', `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`)
  res.send(toCsv(columns, rows))
}
