import React, { useState, useRef, useEffect } from 'react'

// ── Formatting Helpers ──────────────────────────────────────────────────────

export function fmtCurrency(n, monthly = false) {
  const val = monthly ? n / 12 : n
  const abs = Math.abs(val)
  const sign = val < 0 ? '-' : ''
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

export function fmtDelta(n) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${fmtCurrency(n)}`
}

export function fmtPct(n) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

// ── Pill Toggle ─────────────────────────────────────────────────────────────

export function Pill({ options, value, onChange, style }) {
  return (
    <div style={{
      display: 'inline-flex', background: '#e2e8f0', borderRadius: 8, padding: 2, ...style,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            fontWeight: value === opt.value ? 600 : 400,
            background: value === opt.value ? '#fff' : 'transparent',
            color: value === opt.value ? '#0f172a' : '#64748b',
            boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Badge ───────────────────────────────────────────────────────────────────

const BADGE_COLORS = {
  enterprise: { bg: '#dbeafe', color: '#1e40af' },
  shared: { bg: '#fef3c7', color: '#92400e' },
  division: { bg: '#f1f5f9', color: '#475569' },
  'per-seat': { bg: '#ede9fe', color: '#6d28d9' },
  'flat-fee': { bg: '#e0e7ff', color: '#3730a3' },
  todo: { bg: '#fef2f2', color: '#dc2626' },
  confirmed: { bg: '#f0fdf4', color: '#16a34a' },
  AUD: { bg: '#f1f5f9', color: '#475569' },
  USD: { bg: '#dbeafe', color: '#1d4ed8' },
  EUR: { bg: '#fef3c7', color: '#b45309' },
  fixed: { bg: '#fef2f2', color: '#dc2626' },
  cpi: { bg: '#fef3c7', color: '#b45309' },
  ppi: { bg: '#dbeafe', color: '#2563eb' },
  market: { bg: '#f1f5f9', color: '#64748b' },
  locked: { bg: '#f0fdf4', color: '#16a34a' },
  override: { bg: '#f5f3ff', color: '#7c3aed' },
  overdue: { bg: '#fef2f2', color: '#dc2626' },
  soon: { bg: '#fef3c7', color: '#b45309' },
  healthy: { bg: '#f0fdf4', color: '#16a34a' },
}

export function Badge({ type, children, style }) {
  const colors = BADGE_COLORS[type] || { bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: "'IBM Plex Sans', sans-serif",
      background: colors.bg,
      color: colors.color,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  )
}

// ── Inline Editable Number ──────────────────────────────────────────────────

export function InlineNum({ value, onChange, prefix = '', suffix = '', placeholder = '—', min, style }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef()

  useEffect(() => {
    if (editing && ref.current) ref.current.focus()
  }, [editing])

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={draft}
        min={min}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          const n = parseFloat(draft)
          if (!isNaN(n)) onChange(n)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.target.blur()
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          padding: '2px 6px',
          border: '2px solid #3b82f6',
          borderRadius: 4,
          outline: 'none',
          width: 100,
          background: '#fff',
          ...style,
        }}
      />
    )
  }

  const display = value != null ? `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}${suffix}` : placeholder
  return (
    <span
      onClick={() => { setDraft(value ?? ''); setEditing(true) }}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 13,
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: 4,
        border: '1px solid transparent',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onMouseEnter={e => e.target.style.borderColor = '#cbd5e1'}
      onMouseLeave={e => e.target.style.borderColor = 'transparent'}
    >
      {display}
    </span>
  )
}

// ── Inline Editable Text ────────────────────────────────────────────────────

export function InlineText({ value, onChange, placeholder = '—', style }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef()

  useEffect(() => {
    if (editing && ref.current) ref.current.focus()
  }, [editing])

  if (editing) {
    return (
      <input
        ref={ref}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (draft.trim()) onChange(draft.trim())
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.target.blur()
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 13,
          padding: '2px 6px',
          border: '2px solid #3b82f6',
          borderRadius: 4,
          outline: 'none',
          width: 200,
          background: '#fff',
          ...style,
        }}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value || ''); setEditing(true) }}
      style={{
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: 4,
        border: '1px solid transparent',
        ...style,
      }}
      onMouseEnter={e => e.target.style.borderColor = '#cbd5e1'}
      onMouseLeave={e => e.target.style.borderColor = 'transparent'}
    >
      {value || placeholder}
    </span>
  )
}

// ── Editable Seat Cell ──────────────────────────────────────────────────────

export function EditableCell({ value, onChange, maxSeats = 2000 }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef()

  useEffect(() => {
    if (editing && ref.current) { ref.current.focus(); ref.current.select() }
  }, [editing])

  const intensity = maxSeats > 0 ? Math.min((value || 0) / maxSeats, 1) : 0
  const bg = value > 0 ? `rgba(59, 130, 246, ${0.05 + intensity * 0.2})` : 'transparent'

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={draft}
        min={0}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          const n = parseInt(draft)
          onChange(isNaN(n) ? 0 : Math.max(0, n))
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.target.blur()
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          padding: '2px 4px',
          border: '2px solid #3b82f6',
          borderRadius: 3,
          outline: 'none',
          width: 60,
          textAlign: 'right',
          background: '#fff',
        }}
      />
    )
  }

  return (
    <div
      onClick={() => { setDraft(value || ''); setEditing(true) }}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        padding: '2px 4px',
        textAlign: 'right',
        cursor: 'pointer',
        background: bg,
        borderRadius: 3,
        minWidth: 50,
        minHeight: 22,
      }}
    >
      {value || ''}
    </div>
  )
}

// ── Override Cell (Scenario) ────────────────────────────────────────────────

export function OverrideCell({ value, isOverride, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef()

  useEffect(() => {
    if (editing && ref.current) { ref.current.focus(); ref.current.select() }
  }, [editing])

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          const n = parseFloat(draft)
          if (!isNaN(n)) onChange(n)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.target.blur()
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          padding: '2px 6px',
          border: '2px solid #7c3aed',
          borderRadius: 4,
          outline: 'none',
          width: 110,
          background: '#faf5ff',
        }}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(Math.round(value)); setEditing(true) }}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 13,
        padding: '2px 6px',
        cursor: 'pointer',
        borderRadius: 4,
        background: isOverride ? '#f5f3ff' : 'transparent',
        color: isOverride ? '#7c3aed' : 'inherit',
        fontWeight: isOverride ? 600 : 400,
        border: isOverride ? '1px solid #c4b5fd' : '1px solid transparent',
      }}
    >
      {fmtCurrency(value)}
    </span>
  )
}

// ── Number Input (Settings) ─────────────────────────────────────────────────

export function NumberInput({ value, onChange, label, step = 1, min, max, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      {label && <label style={{ fontSize: 13, color: '#475569', minWidth: 120 }}>{label}</label>}
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={e => {
          const n = parseFloat(e.target.value)
          if (!isNaN(n)) onChange(n)
        }}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          padding: '4px 8px',
          border: '1px solid #cbd5e1',
          borderRadius: 4,
          outline: 'none',
          width: 100,
          background: '#fff',
        }}
      />
    </div>
  )
}

// ── Rate Slider ─────────────────────────────────────────────────────────────

export function RateSlider({ label, value, onChange, min = -10, max = 10, step = 0.1, subText }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 14,
          fontWeight: 600,
          color: value > 0 ? '#dc2626' : value < 0 ? '#16a34a' : '#475569',
        }}>
          {value >= 0 ? '+' : ''}{value.toFixed(1)}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#3b82f6' }}
      />
      {subText && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subText}</div>}
    </div>
  )
}

// ── Import Modal ────────────────────────────────────────────────────────────

export function ImportModal({ onImport, onClose }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState([])
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file.'])
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const { parseCSV, validateImport } = require('./csv.js')
      const rows = parseCSV(e.target.result)
      const result = validateImport(rows)
      setPreview(result)
      setErrors(result.errors)
    }
    reader.readAsText(f)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32, maxWidth: 600, width: '90%',
        maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Import CSV</h2>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#3b82f6' : '#cbd5e1'}`,
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#eff6ff' : '#f8fafc',
            transition: 'all 0.15s',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, color: '#64748b' }}>
            {file ? file.name : 'Drop CSV file here or click to browse'}
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {errors.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4, fontSize: 13 }}>Validation Errors:</div>
            {errors.map((err, i) => (
              <div key={i} style={{ fontSize: 12, color: '#991b1b' }}>{err}</div>
            ))}
          </div>
        )}

        {preview && preview.apps.length > 0 && errors.length === 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
              Ready to import {preview.apps.length} apps
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 6, border: '1px solid #cbd5e1',
            background: '#fff', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button
            disabled={!preview || preview.apps.length === 0 || errors.length > 0}
            onClick={() => { if (preview) onImport(preview.apps, preview.allocations) }}
            style={{
              padding: '8px 20px', borderRadius: 6, border: 'none',
              background: preview && preview.apps.length > 0 && errors.length === 0 ? '#3b82f6' : '#94a3b8',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >Confirm Import</button>
        </div>
      </div>
    </div>
  )
}

// ── Summary Card ────────────────────────────────────────────────────────────

export function SummaryCard({ title, value, subtitle, accent = '#3b82f6', style }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 8,
      padding: '16px 20px',
      borderTop: `3px solid ${accent}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#0f172a' }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

// ── Division Card ───────────────────────────────────────────────────────────

export function DivisionCard({ name, headcount, enterpriseCost, specialistCost, total, perEmployee, monthly }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 8, padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '3px solid #3b82f6',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{name}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{headcount.toLocaleString()} staff</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 2 }}>
        <span>Enterprise</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(enterpriseCost, monthly)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
        <span>Specialist</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(specialistCost, monthly)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
        <span>Total</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(total, monthly)}</span>
      </div>
      <div style={{
        marginTop: 8, background: '#0f172a', borderRadius: 4, padding: '4px 8px',
        color: '#fff', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center',
      }}>
        {fmtCurrency(perEmployee, monthly)} / employee
      </div>
    </div>
  )
}
