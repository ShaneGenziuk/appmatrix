import { ALL_DEPARTMENTS } from './data.js'

// ── Custom CSV Parser ───────────────────────────────────────────────────────

export function parseCSV(text) {
  const rows = []
  let current = ''
  let inQuotes = false
  let row = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"'
        i++ // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(current.trim())
        current = ''
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(current.trim())
        current = ''
        if (row.length > 1 || row[0] !== '') rows.push(row)
        row = []
        if (ch === '\r') i++ // skip \n after \r
      } else {
        current += ch
      }
    }
  }
  // Last field/row
  row.push(current.trim())
  if (row.length > 1 || row[0] !== '') rows.push(row)

  return rows
}

// ── Export ───────────────────────────────────────────────────────────────────

export function exportAppsCSV(apps, allocations) {
  const depts = ALL_DEPARTMENTS
  const headers = [
    'Name', 'Tier', 'Pricing', 'Per Seat Rate', 'Annual Spend',
    'Currency', 'Status', 'Divisions',
    'Renewal Date', 'Term (Months)', 'Escalation Rate %',
    'Escalation Type', 'Min Volume', 'Extension (Months)',
    ...depts,
  ]

  const rows = apps.map(app => {
    const fields = [
      csvEscape(app.name),
      app.tier,
      app.perSeat ? 'per-seat' : 'flat-fee',
      app.annualPerSeat ?? '',
      app.annualSpend,
      app.currency,
      app.pricingTodo ? 'todo' : 'confirmed',
      app.divisions.join('; '),
      app.renewalDate ?? '',
      app.termMonths ?? '',
      app.escalationRate ?? '',
      app.escalationType ?? '',
      app.minVolume ?? '',
      app.extensionMonths ?? '',
      ...depts.map(dept => allocations[`${dept}|${app.id}`] ?? ''),
    ]
    return fields.join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

function csvEscape(val) {
  if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return String(val)
}

// ── Import Validation ───────────────────────────────────────────────────────

const REQUIRED = ['Name', 'Tier', 'Pricing', 'Annual Spend', 'Currency', 'Status']
const VALID_TIERS = ['enterprise', 'shared', 'division']
const VALID_CURRENCIES = ['AUD', 'USD', 'EUR']

export function validateImport(rows) {
  if (rows.length < 2) return { errors: ['File must have a header row and at least one data row.'], apps: [], allocations: {} }

  const headers = rows[0].map(h => h.trim())
  const errors = []

  // Check required columns
  for (const req of REQUIRED) {
    if (!headers.includes(req)) {
      errors.push(`Missing required column: ${req}`)
    }
  }
  if (errors.length > 0) return { errors, apps: [], allocations: {} }

  const col = name => headers.indexOf(name)
  const apps = []
  const allocations = {}

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 1
    const name = r[col('Name')]?.trim()
    const tier = r[col('Tier')]?.trim()?.toLowerCase()
    const pricing = r[col('Pricing')]?.trim()?.toLowerCase()
    const annualSpend = parseFloat(r[col('Annual Spend')] || '0')
    const currency = r[col('Currency')]?.trim()?.toUpperCase()
    const status = r[col('Status')]?.trim()?.toLowerCase()

    if (!name) { errors.push(`Row ${rowNum}: Name is required`); continue }
    if (!VALID_TIERS.includes(tier)) { errors.push(`Row ${rowNum}: Invalid tier "${tier}"`); continue }
    if (!VALID_CURRENCIES.includes(currency)) { errors.push(`Row ${rowNum}: Invalid currency "${currency}"`); continue }

    const perSeat = pricing === 'per-seat'
    const id = `imp${i}`

    const app = {
      id,
      name,
      tier,
      perSeat,
      annualPerSeat: perSeat ? parseFloat(r[col('Per Seat Rate')] || '0') : null,
      annualSpend: isNaN(annualSpend) ? 0 : annualSpend,
      divisions: (r[col('Divisions')] || '').split(';').map(s => s.trim()).filter(Boolean),
      pricingTodo: status === 'todo',
      currency,
      renewalDate: r[col('Renewal Date')]?.trim() || null,
      termMonths: parseInt(r[col('Term (Months)')] || '') || null,
      escalationRate: parseFloat(r[col('Escalation Rate %')] || '') || null,
      escalationType: r[col('Escalation Type')]?.trim()?.toLowerCase() || null,
      minVolume: parseInt(r[col('Min Volume')] || '') || null,
      extensionMonths: parseInt(r[col('Extension (Months)')] || '') || null,
    }
    apps.push(app)

    // Seat allocations from department columns
    for (const dept of ALL_DEPARTMENTS) {
      const ci = headers.indexOf(dept)
      if (ci >= 0 && r[ci]) {
        const seats = parseInt(r[ci])
        if (!isNaN(seats) && seats > 0) {
          allocations[`${dept}|${id}`] = seats
        }
      }
    }
  }

  return { errors, apps, allocations }
}

// ── Scenario Exports ────────────────────────────────────────────────────────

export function exportComparisonCSV(projections) {
  const headers = ['Application', 'Escalation Type', 'Current Cost', 'Projected Cost', 'Delta', 'Driver']
  const rows = projections.map(p => [
    csvEscape(p.app.name),
    p.app.escalationType || 'none',
    p.current.toFixed(0),
    p.projected.toFixed(0),
    p.delta.toFixed(0),
    csvEscape(p.driver),
  ].join(','))
  return [headers.join(','), ...rows].join('\n')
}

export function exportWaterfallCSV(waterfall) {
  const headers = ['Category', 'Delta']
  const rows = waterfall.map(w => [csvEscape(w.label), w.delta.toFixed(0)].join(','))
  return [headers.join(','), ...rows].join('\n')
}

export function exportMultiYearCSV(yearData) {
  const headers = ['Year', 'Total Spend', 'Locked Spend', 'Headcount']
  const rows = yearData.map(y => [
    y.year === 0 ? 'FY26 (Current)' : `FY${26 + y.year}`,
    y.totalSpend.toFixed(0),
    y.lockedSpend.toFixed(0),
    y.headcount,
  ].join(','))
  return [headers.join(','), ...rows].join('\n')
}

export function buildSummaryText(projections, yearData, scenario) {
  const current = projections.reduce((s, p) => s + p.current, 0)
  const projected = projections.reduce((s, p) => s + p.projected, 0)
  const delta = projected - current
  const pct = current > 0 ? ((delta / current) * 100).toFixed(1) : '0.0'

  return [
    `AppMatrix Scenario: ${scenario.name}`,
    `Current Annual Spend: $${fmtNum(current)}`,
    `Projected Annual Spend: $${fmtNum(projected)}`,
    `Net Impact: ${delta >= 0 ? '+' : ''}$${fmtNum(delta)} (${delta >= 0 ? '+' : ''}${pct}%)`,
    ``,
    `Assumptions:`,
    `  CPI: ${scenario.rates.cpi}%`,
    `  PPI: ${scenario.rates.ppi}%`,
    `  USD shift: ${scenario.rates.usdShift}%`,
    `  EUR shift: ${scenario.rates.eurShift}%`,
    `  HC growth: ${scenario.rates.hcGrowth}%`,
  ].join('\n')
}

function fmtNum(n) {
  return Math.abs(n).toLocaleString('en-AU', { maximumFractionDigits: 0 })
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
