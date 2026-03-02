import React, { useState, useMemo, useCallback } from 'react'
import {
  DIVISIONS, DEFAULT_APPS, DEFAULT_ALLOCATIONS, DEFAULT_FX, DEFAULT_SCENARIO,
  getDivisionsForApp, getDepartmentsForApp, getTotalHeadcount, getDivisionHeadcount,
} from './data.js'
import {
  computeAppCost, getTotalSeats, fxMultiplier,
  computeScenario, projectMultiYear, buildTimeline, buildWaterfall,
} from './engine.js'
import {
  exportAppsCSV, parseCSV, validateImport, downloadCSV,
  exportComparisonCSV, exportWaterfallCSV, exportMultiYearCSV, buildSummaryText,
} from './csv.js'
import {
  Pill, Badge, InlineNum, InlineText, EditableCell, OverrideCell,
  NumberInput, RateSlider, SummaryCard, DivisionCard,
  fmtCurrency, fmtDelta, fmtPct,
} from './components.jsx'

// ── Styles ──────────────────────────────────────────────────────────────────

const S = {
  header: {
    background: '#0f172a', color: '#fff', padding: '12px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' },
  headerSub: { fontSize: 12, color: '#94a3b8' },
  btn: {
    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500,
    transition: 'background 0.15s',
  },
  btnPrimary: {
    padding: '6px 14px', borderRadius: 6, border: 'none',
    background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  content: { padding: 24, maxWidth: 1400, margin: '0 auto' },
  cardsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 },
  divRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 20 },
  filterBar: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap',
  },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: {
    textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
  },
  td: {
    padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9',
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  tdMono: {
    padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9',
    fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right',
  },
  groupHeader: {
    padding: '8px 12px', background: '#f1f5f9', fontWeight: 600, fontSize: 12,
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  expandedRow: { background: '#fafbfc', padding: 16, borderBottom: '1px solid #e2e8f0' },
  settingsPanel: {
    background: '#fff', borderRadius: 8, padding: 20, marginTop: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderTop: '3px solid #6366f1',
  },
  // Scenario
  scenarioWrap: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0, minHeight: 'calc(100vh - 60px)' },
  sidebar: { background: '#fff', borderRight: '1px solid #e2e8f0', padding: 16, overflowY: 'auto' },
  mainPanel: { padding: 24, overflowY: 'auto' },
}

// ── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  // Core state
  const [apps, setApps] = useState(DEFAULT_APPS)
  const [allocations, setAllocations] = useState(DEFAULT_ALLOCATIONS)
  const [divisions, setDivisions] = useState(DIVISIONS)
  const [fx, setFx] = useState(DEFAULT_FX)
  const [fxStamp, setFxStamp] = useState(null)
  const [monthly, setMonthly] = useState(false)

  // UI state
  const [scenarioMode, setScenarioMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [divFilter, setDivFilter] = useState('All')
  const [todoOnly, setTodoOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const [showImport, setShowImport] = useState(false)

  // Scenario state
  const [scenarios, setScenarios] = useState([{ ...DEFAULT_SCENARIO }])
  const [activeScenario, setActiveScenario] = useState(0)
  const [scenarioTab, setScenarioTab] = useState('rates')

  const scenario = scenarios[activeScenario]
  const totalHC = getTotalHeadcount(divisions)

  // ── Computed Values ─────────────────────────────────────────────────────

  const filteredApps = useMemo(() => {
    let result = apps
    if (divFilter !== 'All') {
      result = result.filter(a => a.tier === 'enterprise' || a.divisions.includes(divFilter))
    }
    if (todoOnly) result = result.filter(a => a.pricingTodo)
    if (search) result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    return result
  }, [apps, divFilter, todoOnly, search])

  const totalSpend = useMemo(() => apps.reduce((s, a) => s + computeAppCost(a, divisions, allocations, fx), 0), [apps, divisions, allocations, fx])
  const enterpriseSpend = useMemo(() => apps.filter(a => a.tier === 'enterprise').reduce((s, a) => s + computeAppCost(a, divisions, allocations, fx), 0), [apps, divisions, allocations, fx])
  const specialistApps = apps.filter(a => a.tier !== 'enterprise')
  const specialistSpend = useMemo(() => specialistApps.reduce((s, a) => s + computeAppCost(a, divisions, allocations, fx), 0), [specialistApps, divisions, allocations, fx])
  const todoCount = apps.filter(a => a.pricingTodo).length

  // Division costs
  const divisionCosts = useMemo(() => {
    return divisions.map(div => {
      const divHC = div.headcount
      const entCost = enterpriseSpend * (divHC / totalHC)
      const specCost = apps
        .filter(a => a.tier !== 'enterprise' && a.divisions.includes(div.name))
        .reduce((s, a) => s + computeAppCost(a, divisions, allocations, fx), 0)
      const total = entCost + specCost
      return { name: div.name, headcount: divHC, enterpriseCost: entCost, specialistCost: specCost, total, perEmployee: total / divHC }
    })
  }, [divisions, apps, allocations, fx, enterpriseSpend, totalHC])

  // Scenario projections
  const projections = useMemo(() => scenarioMode ? computeScenario(apps, divisions, allocations, fx, scenario) : [], [scenarioMode, apps, divisions, allocations, fx, scenario])
  const multiYear = useMemo(() => scenarioMode ? projectMultiYear(apps, divisions, allocations, fx, scenario) : [], [scenarioMode, apps, divisions, allocations, fx, scenario])
  const timeline = useMemo(() => scenarioMode ? buildTimeline(apps, divisions, allocations, fx) : [], [scenarioMode, apps, divisions, allocations, fx])
  const waterfall = useMemo(() => scenarioMode ? buildWaterfall(projections) : [], [scenarioMode, projections])

  // ── App Mutations ───────────────────────────────────────────────────────

  const updateApp = useCallback((id, field, value) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }, [])

  const deleteApp = useCallback((id) => {
    setApps(prev => prev.filter(a => a.id !== id))
    setAllocations(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (key.endsWith(`|${id}`)) delete next[key]
      }
      return next
    })
  }, [])

  const addApp = useCallback((tier) => {
    const id = `new${Date.now()}`
    const defaultDiv = tier === 'enterprise' ? [] : [divisions[0].name]
    setApps(prev => [...prev, {
      id, name: 'New Application', tier, perSeat: false, annualPerSeat: null,
      annualSpend: 0, divisions: defaultDiv, pricingTodo: true, currency: 'AUD',
      renewalDate: null, termMonths: null, escalationRate: null, escalationType: null,
      minVolume: null, extensionMonths: null,
    }])
  }, [divisions])

  const setAllocation = useCallback((dept, appId, seats) => {
    setAllocations(prev => ({ ...prev, [`${dept}|${appId}`]: seats }))
  }, [])

  const updateDivHeadcount = useCallback((divName, hc) => {
    setDivisions(prev => prev.map(d => d.name === divName ? { ...d, headcount: hc } : d))
  }, [])

  const updateScenarioRate = useCallback((key, value) => {
    setScenarios(prev => prev.map((s, i) => i === activeScenario ? { ...s, rates: { ...s.rates, [key]: value } } : s))
  }, [activeScenario])

  const setOverride = useCallback((appId, value) => {
    setScenarios(prev => prev.map((s, i) => i === activeScenario ? { ...s, overrides: { ...s.overrides, [appId]: value } } : s))
  }, [activeScenario])

  const clearOverride = useCallback((appId) => {
    setScenarios(prev => prev.map((s, i) => {
      if (i !== activeScenario) return s
      const o = { ...s.overrides }
      delete o[appId]
      return { ...s, overrides: o }
    }))
  }, [activeScenario])

  const clearAllOverrides = useCallback(() => {
    setScenarios(prev => prev.map((s, i) => i === activeScenario ? { ...s, overrides: {} } : s))
  }, [activeScenario])

  // ── CSV Handlers ────────────────────────────────────────────────────────

  const handleExport = () => {
    downloadCSV(exportAppsCSV(apps, allocations), 'appmatrix-export.csv')
  }

  const handleImport = (newApps, newAllocs) => {
    setApps(newApps)
    setAllocations(newAllocs)
    setShowImport(false)
  }

  const handleImportFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result)
      const result = validateImport(rows)
      if (result.errors.length === 0 && result.apps.length > 0) {
        setApps(result.apps)
        setAllocations(result.allocations)
        setShowImport(false)
      }
    }
    reader.readAsText(file)
  }

  // ── Renewal Badge Helper ────────────────────────────────────────────────

  const renewalBadge = (app) => {
    if (!app.renewalDate) return null
    const now = new Date()
    const renewal = new Date(app.renewalDate)
    const diffDays = (renewal - now) / (1000 * 60 * 60 * 24)
    if (diffDays < 0) return <Badge type="overdue">Overdue</Badge>
    if (diffDays <= 90) return <Badge type="soon">Renewing soon</Badge>
    return <Badge type="healthy">Healthy</Badge>
  }

  // ── Group apps for table ────────────────────────────────────────────────

  const groupedApps = useMemo(() => {
    const groups = []
    const ent = filteredApps.filter(a => a.tier === 'enterprise')
    if (ent.length > 0) groups.push({ label: 'Enterprise', apps: ent })

    for (const div of divisions) {
      const divApps = filteredApps.filter(a => a.tier !== 'enterprise' && a.divisions.includes(div.name))
      if (divApps.length > 0) groups.push({ label: div.name, apps: divApps })
    }
    // Shared apps not already shown
    const sharedOnly = filteredApps.filter(a => a.tier === 'shared' && !groups.some(g => g.apps.includes(a)))
    if (sharedOnly.length > 0) groups.push({ label: 'Shared', apps: sharedOnly })

    return groups
  }, [filteredApps, divisions])

  const filteredTotal = filteredApps.reduce((s, a) => s + computeAppCost(a, divisions, allocations, fx), 0)

  // ════════════════════════════════════════════════════════════════════════
  // RENDER — Scenario Mode
  // ════════════════════════════════════════════════════════════════════════

  if (scenarioMode) {
    const projectedTotal = projections.reduce((s, p) => s + p.projected, 0)
    const currentTotal = projections.reduce((s, p) => s + p.current, 0)
    const netImpact = projectedTotal - currentTotal
    const projectedHC = Math.round(totalHC * (1 + scenario.rates.hcGrowth / 100))
    const overrideCount = Object.keys(scenario.overrides).length

    return (
      <div>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.headerTitle}>AppMatrix</div>
            <div style={S.headerSub}>Scenario Modelling</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={S.btn} onClick={() => setScenarioMode(false)}>← Live View</button>
          </div>
        </div>

        <div style={S.scenarioWrap}>
          {/* ── Sidebar ── */}
          <div style={S.sidebar}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#475569' }}>SCENARIOS</div>
            {scenarios.map((sc, idx) => (
              <div
                key={sc.id}
                onClick={() => setActiveScenario(idx)}
                style={{
                  padding: '8px 12px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', fontSize: 13,
                  background: idx === activeScenario ? '#eff6ff' : 'transparent',
                  color: idx === activeScenario ? '#1d4ed8' : '#475569',
                  fontWeight: idx === activeScenario ? 600 : 400,
                  border: idx === activeScenario ? '1px solid #bfdbfe' : '1px solid transparent',
                }}
              >
                {sc.name}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button style={{ ...S.btnPrimary, fontSize: 11, padding: '4px 10px' }} onClick={() => {
                const id = `sc${Date.now()}`
                setScenarios(prev => [...prev, { ...DEFAULT_SCENARIO, id, name: `Scenario ${prev.length + 1}` }])
                setActiveScenario(scenarios.length)
              }}>+ New</button>
              <button style={{ ...S.btn, color: '#475569', borderColor: '#cbd5e1', fontSize: 11, padding: '4px 10px' }} onClick={() => {
                const id = `sc${Date.now()}`
                setScenarios(prev => [...prev, { ...scenario, id, name: `${scenario.name} (copy)`, overrides: { ...scenario.overrides } }])
                setActiveScenario(scenarios.length)
              }}>Duplicate</button>
              {scenarios.length > 1 && (
                <button style={{ ...S.btn, color: '#dc2626', borderColor: '#fca5a5', fontSize: 11, padding: '4px 10px' }} onClick={() => {
                  setScenarios(prev => prev.filter((_, i) => i !== activeScenario))
                  setActiveScenario(Math.max(0, activeScenario - 1))
                }}>Delete</button>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#475569', marginBottom: 6 }}>NOTES</div>
              <textarea
                value={scenario.notes}
                onChange={e => setScenarios(prev => prev.map((s, i) => i === activeScenario ? { ...s, notes: e.target.value } : s))}
                style={{
                  width: '100%', minHeight: 80, padding: 8, border: '1px solid #e2e8f0',
                  borderRadius: 6, fontSize: 12, resize: 'vertical', fontFamily: "'IBM Plex Sans', sans-serif",
                }}
                placeholder="Add notes about this scenario..."
              />
            </div>

            {/* Data Coverage */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#475569', marginBottom: 8 }}>DATA COVERAGE</div>
              {[
                { label: 'Renewal dates', count: apps.filter(a => a.renewalDate).length },
                { label: 'Escalation types', count: apps.filter(a => a.escalationType).length },
                { label: 'Min volumes', count: apps.filter(a => a.minVolume).length },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                    <span>{item.label}</span>
                    <span>{item.count}/{apps.length}</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 4, height: 6 }}>
                    <div style={{ background: '#3b82f6', borderRadius: 4, height: 6, width: `${(item.count / apps.length) * 100}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main Panel ── */}
          <div style={S.mainPanel}>
            {/* Scenario Name */}
            <div style={{ marginBottom: 16 }}>
              <InlineText
                value={scenario.name}
                onChange={v => setScenarios(prev => prev.map((s, i) => i === activeScenario ? { ...s, name: v } : s))}
                style={{ fontSize: 20, fontWeight: 700 }}
              />
            </div>

            {/* Tabs */}
            <Pill
              options={[
                { label: 'Rates & Levers', value: 'rates' },
                { label: 'Waterfall', value: 'waterfall' },
                { label: 'App-by-App', value: 'appbyapp' },
                { label: 'Timeline', value: 'timeline' },
                { label: 'Divisions', value: 'divisions' },
              ]}
              value={scenarioTab}
              onChange={setScenarioTab}
              style={{ marginBottom: 20 }}
            />

            {/* Impact Summary Cards */}
            <div style={S.cardsRow}>
              <SummaryCard title="Current" value={fmtCurrency(currentTotal, monthly)} accent="#64748b" />
              <SummaryCard title="Projected" value={fmtCurrency(projectedTotal, monthly)} accent="#3b82f6" />
              <SummaryCard
                title="Net Impact"
                value={fmtDelta(netImpact)}
                subtitle={currentTotal > 0 ? fmtPct((netImpact / currentTotal) * 100) : ''}
                accent={netImpact > 0 ? '#dc2626' : '#16a34a'}
              />
              <SummaryCard title="Projected HC" value={projectedHC.toLocaleString()} subtitle={fmtPct(scenario.rates.hcGrowth)} accent="#6366f1" />
            </div>

            {/* ── Tab: Rates & Levers ── */}
            {scenarioTab === 'rates' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Global Rate Assumptions</h3>
                  <RateSlider label="CPI / Inflation" value={scenario.rates.cpi} onChange={v => updateScenarioRate('cpi', v)} min={-5} max={10} subText="CPI-linked apps + market flat-fee apps" />
                  <RateSlider label="PPI (Software)" value={scenario.rates.ppi} onChange={v => updateScenarioRate('ppi', v)} min={-5} max={10} subText="PPI-linked apps + market per-seat apps" />
                  <RateSlider label="USD → AUD shift" value={scenario.rates.usdShift} onChange={v => updateScenarioRate('usdShift', v)} subText="USD-denominated apps" />
                  <RateSlider label="EUR → AUD shift" value={scenario.rates.eurShift} onChange={v => updateScenarioRate('eurShift', v)} subText="EUR-denominated apps" />
                  <RateSlider label="Headcount growth" value={scenario.rates.hcGrowth} onChange={v => updateScenarioRate('hcGrowth', v)} subText="Enterprise per-seat apps (seat count scales)" />

                  <div style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Bulk Pricing Type</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={S.btn} onClick={() => setApps(prev => prev.map(a => ({ ...a, perSeat: false })))}>All Flat-Fee</button>
                      <button style={S.btn} onClick={() => setApps(prev => prev.map(a => ({ ...a, perSeat: true })))}>All Per-Seat</button>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Note: Fixed-escalation apps ignore sliders and use their contractual rate</div>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: 'fit-content' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Escalation Distribution</div>
                  {['fixed', 'cpi', 'ppi', 'market', 'locked'].map(type => {
                    const count = apps.filter(a => (a.escalationType || 'market') === type || (!a.escalationType && type === 'market')).length
                    return (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                        <Badge type={type}>{type}</Badge>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#475569' }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Tab: Waterfall ── */}
            {scenarioTab === 'waterfall' && (
              <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Cost Driver Breakdown</h3>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Category</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Net Impact</th>
                      <th style={{ ...S.th, width: 200 }}>Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waterfall.map(w => {
                      const maxDelta = Math.max(...waterfall.map(x => Math.abs(x.delta)), 1)
                      const pct = (Math.abs(w.delta) / maxDelta) * 100
                      return (
                        <tr key={w.key}>
                          <td style={S.td}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: w.color, marginRight: 8 }} />
                            {w.label}
                          </td>
                          <td style={{ ...S.tdMono, color: w.delta > 0 ? '#dc2626' : w.delta < 0 ? '#16a34a' : '#475569' }}>
                            {fmtDelta(w.delta)}
                          </td>
                          <td style={S.td}>
                            <div style={{ background: '#f1f5f9', borderRadius: 4, height: 16, position: 'relative' }}>
                              <div style={{
                                background: w.color, borderRadius: 4, height: 16,
                                width: `${pct}%`, opacity: 0.7, transition: 'width 0.3s',
                              }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Tab: App-by-App ── */}
            {scenarioTab === 'appbyapp' && (
              <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>App-by-App Projections</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Pill
                      options={[
                        { label: 'All', value: 'all' },
                        { label: 'Changed', value: 'changed' },
                        { label: 'Overrides', value: 'overrides' },
                      ]}
                      value={search || 'all'}
                      onChange={v => setSearch(v === 'all' ? '' : v)}
                    />
                    {overrideCount > 0 && (
                      <button style={{ ...S.btn, color: '#7c3aed', borderColor: '#c4b5fd', fontSize: 11 }} onClick={clearAllOverrides}>
                        Clear all overrides ({overrideCount})
                      </button>
                    )}
                  </div>
                </div>

                {overrideCount > 0 && (
                  <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#7c3aed' }}>
                    {overrideCount} override(s) — Total override impact: {fmtDelta(projections.filter(p => scenario.overrides[p.app.id] != null).reduce((s, p) => s + p.delta, 0))}
                  </div>
                )}

                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Application</th>
                      <th style={S.th}>Escalation</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Current</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Projected</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Delta</th>
                      <th style={S.th}>Driver</th>
                      <th style={{ ...S.th, width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections
                      .filter(p => {
                        if (search === 'changed') return Math.abs(p.delta) > 0.01
                        if (search === 'overrides') return scenario.overrides[p.app.id] != null
                        return true
                      })
                      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                      .map(p => (
                        <tr key={p.app.id} style={{ background: scenario.overrides[p.app.id] != null ? '#faf5ff' : undefined }}>
                          <td style={S.td}>{p.app.name}</td>
                          <td style={S.td}><Badge type={p.app.escalationType || 'market'}>{p.app.escalationType || 'market'}</Badge></td>
                          <td style={S.tdMono}>{fmtCurrency(p.current, monthly)}</td>
                          <td style={S.tdMono}>
                            <OverrideCell
                              value={monthly ? p.projected / 12 : p.projected}
                              isOverride={scenario.overrides[p.app.id] != null}
                              onChange={v => setOverride(p.app.id, monthly ? v * 12 : v)}
                            />
                          </td>
                          <td style={{ ...S.tdMono, color: p.delta > 0 ? '#dc2626' : p.delta < 0 ? '#16a34a' : '#475569' }}>
                            {fmtDelta(monthly ? p.delta / 12 : p.delta)}
                          </td>
                          <td style={{ ...S.td, fontSize: 11, color: '#64748b' }}>{p.driver}</td>
                          <td style={S.td}>
                            {scenario.overrides[p.app.id] != null && (
                              <button onClick={() => clearOverride(p.app.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Tab: Timeline ── */}
            {scenarioTab === 'timeline' && (
              <div>
                <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>FY27 Renewal Timeline (Top 15 by Spend)</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 10, color: '#94a3b8' }}>
                    {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                      <span key={m} style={{ flex: 1, textAlign: 'center' }}>{m}</span>
                    ))}
                  </div>
                  {timeline.map(t => {
                    const escType = t.app.escalationType || 'market'
                    const escColors = { fixed: '#ef4444', cpi: '#f59e0b', ppi: '#3b82f6', market: '#eab308', locked: '#22c55e', override: '#a855f7' }
                    const color = escColors[escType] || '#94a3b8'
                    const oldPct = t.newRateMonth != null ? (t.newRateMonth / 12) * 100 : 100
                    const newPct = 100 - oldPct

                    return (
                      <div key={t.app.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                        <div style={{ width: 160, fontSize: 11, color: '#475569', textAlign: 'right', flexShrink: 0 }}>
                          {t.app.name}
                          {!t.hasDate && <span style={{ color: '#f59e0b', marginLeft: 4 }}>⚠</span>}
                        </div>
                        <div style={{ flex: 1, display: 'flex', height: 18, borderRadius: 3, overflow: 'hidden' }}>
                          {oldPct > 0 && <div style={{ width: `${oldPct}%`, background: '#e2e8f0' }} />}
                          {newPct > 0 && <div style={{ width: `${newPct}%`, background: color, opacity: 0.7 }} />}
                        </div>
                        <div style={{ width: 80, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#64748b', textAlign: 'right' }}>
                          {fmtCurrency(t.cost)}
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Fixed', color: '#ef4444' }, { label: 'CPI', color: '#f59e0b' },
                      { label: 'PPI', color: '#3b82f6' }, { label: 'Market', color: '#eab308' },
                      { label: 'Locked', color: '#22c55e' }, { label: 'Current rate', color: '#e2e8f0' },
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3-Year Outlook */}
                <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>3-Year Outlook</h3>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}></th>
                        {multiYear.map(y => <th key={y.year} style={{ ...S.th, textAlign: 'right' }}>{y.year === 0 ? 'FY26 (Current)' : `FY${26 + y.year}`}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={S.td}>Total Spend</td>
                        {multiYear.map(y => <td key={y.year} style={S.tdMono}>{fmtCurrency(y.totalSpend)}</td>)}
                      </tr>
                      <tr>
                        <td style={S.td}>Locked Portion</td>
                        {multiYear.map(y => <td key={y.year} style={S.tdMono}>{fmtCurrency(y.lockedSpend)}</td>)}
                      </tr>
                      <tr>
                        <td style={S.td}>Headcount</td>
                        {multiYear.map(y => <td key={y.year} style={S.tdMono}>{y.headcount.toLocaleString()}</td>)}
                      </tr>
                      <tr>
                        <td style={S.td}>Per Employee</td>
                        {multiYear.map(y => <td key={y.year} style={S.tdMono}>{fmtCurrency(y.totalSpend / y.headcount)}</td>)}
                      </tr>
                      {multiYear.length > 1 && (
                        <tr>
                          <td style={S.td}>Delta vs FY26</td>
                          {multiYear.map(y => (
                            <td key={y.year} style={{ ...S.tdMono, color: y.totalSpend - multiYear[0].totalSpend > 0 ? '#dc2626' : '#16a34a' }}>
                              {y.year === 0 ? '—' : fmtDelta(y.totalSpend - multiYear[0].totalSpend)}
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 20, height: 120 }}>
                    {multiYear.map(y => {
                      const maxSpend = Math.max(...multiYear.map(x => x.totalSpend), 1)
                      const h = (y.totalSpend / maxSpend) * 100
                      const lockedH = (y.lockedSpend / maxSpend) * 100
                      return (
                        <div key={y.year} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                            <div style={{ position: 'relative' }}>
                              <div style={{ background: '#3b82f6', borderRadius: '4px 4px 0 0', height: h, opacity: 0.3, transition: 'height 0.3s' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#22c55e', height: lockedH, opacity: 0.5, borderRadius: '0 0 0 0', transition: 'height 0.3s' }} />
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{y.year === 0 ? 'FY26' : `FY${26 + y.year}`}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Divisions ── */}
            {scenarioTab === 'divisions' && (
              <div>
                <div style={S.divRow}>
                  {divisions.map(div => {
                    const divHC = div.headcount
                    const projHC = Math.round(divHC * (1 + scenario.rates.hcGrowth / 100))
                    const curEntCost = enterpriseSpend * (divHC / totalHC)
                    const projEntCost = projectedTotal * (projHC / (totalHC * (1 + scenario.rates.hcGrowth / 100))) * (enterpriseSpend / currentTotal)

                    const curSpecCost = apps
                      .filter(a => a.tier !== 'enterprise' && a.divisions.includes(div.name))
                      .reduce((s, a) => s + computeAppCost(a, divisions, allocations, fx), 0)
                    const projSpecCost = projections
                      .filter(p => p.app.tier !== 'enterprise' && p.app.divisions.includes(div.name))
                      .reduce((s, p) => s + p.projected, 0)

                    const curTotal = curEntCost + curSpecCost
                    const projTotal = projEntCost + projSpecCost
                    const delta = projTotal - curTotal

                    return (
                      <div key={div.name} style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '3px solid #3b82f6' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{div.name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
                          <span style={{ color: '#64748b' }}>Current HC</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>{divHC.toLocaleString()}</span>
                          <span style={{ color: '#64748b' }}>Projected HC</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>{projHC.toLocaleString()}</span>
                          <span style={{ color: '#64748b' }}>Enterprise (cur)</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>{fmtCurrency(curEntCost)}</span>
                          <span style={{ color: '#64748b' }}>Enterprise (proj)</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>{fmtCurrency(projEntCost)}</span>
                          <span style={{ color: '#64748b' }}>Specialist (cur)</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>{fmtCurrency(curSpecCost)}</span>
                          <span style={{ color: '#64748b' }}>Specialist (proj)</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>{fmtCurrency(projSpecCost)}</span>
                        </div>
                        <div style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
                          <div>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600 }}>{fmtCurrency(projTotal)}</span>
                            <Badge type={delta > 0 ? 'overdue' : 'healthy'} style={{ marginLeft: 6 }}>{fmtDelta(delta)}</Badge>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                          <span>Per head (cur): {fmtCurrency(curTotal / divHC)}</span>
                          <span>Per head (proj): {fmtCurrency(projTotal / projHC)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Scenario Export Bar ── */}
            <div style={{
              marginTop: 24, padding: 16, background: '#fff', borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', gap: 8, flexWrap: 'wrap',
            }}>
              <button style={S.btnPrimary} onClick={() => downloadCSV(exportComparisonCSV(projections), `${scenario.name}-comparison.csv`)}>Comparison CSV</button>
              <button style={S.btnPrimary} onClick={() => downloadCSV(exportWaterfallCSV(waterfall), `${scenario.name}-waterfall.csv`)}>Waterfall CSV</button>
              <button style={S.btnPrimary} onClick={() => downloadCSV(exportMultiYearCSV(multiYear), `${scenario.name}-multiyear.csv`)}>Multi-Year CSV</button>
              <button style={{ ...S.btn, color: '#475569', borderColor: '#cbd5e1' }} onClick={() => {
                navigator.clipboard.writeText(buildSummaryText(projections, multiYear, scenario))
              }}>Copy Summary</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER — Live View Mode
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>AppMatrix</div>
          <div style={S.headerSub}>{totalHC.toLocaleString()} staff · {apps.length} applications</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={S.btn} onClick={handleExport}>Export CSV</button>
          <button style={S.btn} onClick={() => setShowImport(true)}>Import CSV</button>
          <button style={S.btn} onClick={() => setShowSettings(s => !s)}>{showSettings ? 'Hide Settings' : 'Settings'}</button>
          <button style={S.btnPrimary} onClick={() => setScenarioMode(true)}>Scenarios →</button>
          <Pill
            options={[{ label: 'Annual', value: false }, { label: 'Monthly', value: true }]}
            value={monthly}
            onChange={setMonthly}
          />
        </div>
      </div>

      <div style={S.content}>
        {/* Summary Cards */}
        <div style={S.cardsRow}>
          <SummaryCard title="Total" value={fmtCurrency(totalSpend, monthly)} subtitle={`${apps.length} applications`} accent="#0f172a" />
          <SummaryCard title="Enterprise" value={fmtCurrency(enterpriseSpend, monthly)} subtitle={`${fmtCurrency(enterpriseSpend / totalHC, monthly)} per head`} accent="#3b82f6" />
          <SummaryCard title="Specialist" value={fmtCurrency(specialistSpend, monthly)} subtitle={`${specialistApps.length} apps`} accent="#6366f1" />
          <SummaryCard title="To-Do" value={todoCount} subtitle="apps need pricing" accent={todoCount > 0 ? '#dc2626' : '#22c55e'} />
        </div>

        {/* Division Cards */}
        <div style={S.divRow}>
          {divisionCosts.map(dc => (
            <DivisionCard key={dc.name} {...dc} monthly={monthly} />
          ))}
        </div>

        {/* Filters */}
        <div style={S.filterBar}>
          <Pill
            options={[{ label: 'All', value: 'All' }, ...divisions.map(d => ({ label: d.name, value: d.name }))]}
            value={divFilter}
            onChange={setDivFilter}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={todoOnly} onChange={e => setTodoOnly(e.target.checked)} />
            Show To-Do only
          </label>
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6,
              fontSize: 13, outline: 'none', width: 200,
            }}
          />
        </div>

        {/* Application Table */}
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 30 }}></th>
              <th style={S.th}>Application</th>
              <th style={{ ...S.th, width: 80 }}>Pricing</th>
              <th style={{ ...S.th, textAlign: 'right', width: 100 }}>Per Seat</th>
              <th style={{ ...S.th, textAlign: 'right', width: 70 }}>Seats</th>
              <th style={{ ...S.th, textAlign: 'right', width: 120 }}>{monthly ? 'Monthly' : 'Annual'}</th>
              <th style={{ ...S.th, width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {groupedApps.map(group => (
              <React.Fragment key={group.label}>
                <tr>
                  <td colSpan={7} style={S.groupHeader}>{group.label}</td>
                </tr>
                {group.apps.map(app => {
                  const cost = computeAppCost(app, divisions, allocations, fx)
                  const seats = app.tier === 'enterprise' ? totalHC : getTotalSeats(app, allocations)
                  const isExpanded = expanded[app.id]
                  const depts = app.tier === 'enterprise' ? [] : getDepartmentsForApp(app)
                  const appDivisions = getDivisionsForApp(app)

                  return (
                    <React.Fragment key={app.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(prev => ({ ...prev, [app.id]: !prev[app.id] }))}>
                        <td style={S.td}>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>{isExpanded ? '▼' : '▶'}</span>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontWeight: 500 }}>{app.name}</span>
                          <Badge type={app.tier} style={{ marginLeft: 6 }}>{app.tier}</Badge>
                          {app.pricingTodo && <Badge type="todo" style={{ marginLeft: 4 }}>To-Do</Badge>}
                          {app.currency !== 'AUD' && <Badge type={app.currency} style={{ marginLeft: 4 }}>{app.currency}</Badge>}
                        </td>
                        <td style={S.td} onClick={e => e.stopPropagation()}>
                          <span
                            onClick={() => updateApp(app.id, 'perSeat', !app.perSeat)}
                            style={{ cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, background: app.perSeat ? '#ede9fe' : '#e0e7ff', color: app.perSeat ? '#6d28d9' : '#3730a3' }}
                          >
                            {app.perSeat ? 'per-seat' : 'flat-fee'}
                          </span>
                        </td>
                        <td style={S.tdMono} onClick={e => e.stopPropagation()}>
                          {app.perSeat ? (
                            <InlineNum
                              value={app.annualPerSeat}
                              onChange={v => updateApp(app.id, 'annualPerSeat', v)}
                              prefix="$"
                            />
                          ) : '—'}
                        </td>
                        <td style={S.tdMono}>{seats > 0 ? seats.toLocaleString() : '—'}</td>
                        <td style={{ ...S.tdMono, fontWeight: 600 }}>{fmtCurrency(cost, monthly)}</td>
                        <td style={S.td} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => deleteApp(app.id)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, padding: '0 4px' }}
                            title="Delete app"
                          >×</button>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={S.expandedRow}>
                            {/* Contract Details */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Contract Details</div>
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 11, color: '#64748b' }}>Renewal:</span>
                                  <input
                                    type="date"
                                    value={app.renewalDate || ''}
                                    onChange={e => updateApp(app.id, 'renewalDate', e.target.value || null)}
                                    style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px' }}
                                  />
                                  {renewalBadge(app)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 11, color: '#64748b' }}>Term:</span>
                                  <InlineNum value={app.termMonths} onChange={v => updateApp(app.id, 'termMonths', v)} suffix=" mo" min={1} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 11, color: '#64748b' }}>Escalation:</span>
                                  <select
                                    value={app.escalationType || ''}
                                    onChange={e => updateApp(app.id, 'escalationType', e.target.value || null)}
                                    style={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px' }}
                                  >
                                    <option value="">None</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="cpi">CPI</option>
                                    <option value="ppi">PPI</option>
                                    <option value="market">Market</option>
                                    <option value="locked">Locked</option>
                                  </select>
                                </div>
                                {app.escalationType === 'fixed' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 11, color: '#64748b' }}>Rate:</span>
                                    <InlineNum value={app.escalationRate} onChange={v => updateApp(app.id, 'escalationRate', v)} suffix="%" />
                                  </div>
                                )}
                                {app.perSeat && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 11, color: '#64748b' }}>Min Vol:</span>
                                    <InlineNum value={app.minVolume} onChange={v => updateApp(app.id, 'minVolume', v)} />
                                    {app.minVolume && seats < app.minVolume && (
                                      <Badge type="overdue">Below minimum ({app.minVolume})</Badge>
                                    )}
                                  </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 11, color: '#64748b' }}>Extension:</span>
                                  <select
                                    value={app.extensionMonths || ''}
                                    onChange={e => updateApp(app.id, 'extensionMonths', parseInt(e.target.value) || null)}
                                    style={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px' }}
                                  >
                                    <option value="">None</option>
                                    {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} mo</option>)}
                                  </select>
                                  {app.extensionMonths && app.renewalDate && (() => {
                                    const r = new Date(app.renewalDate)
                                    r.setMonth(r.getMonth() + app.extensionMonths)
                                    return <Badge type="soon" style={{ marginLeft: 4 }}>New rate from {r.toISOString().slice(0, 10)}</Badge>
                                  })()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 11, color: '#64748b' }}>Currency:</span>
                                  <select
                                    value={app.currency}
                                    onChange={e => updateApp(app.id, 'currency', e.target.value)}
                                    style={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px' }}
                                  >
                                    <option value="AUD">AUD</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                  </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <label style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input type="checkbox" checked={app.pricingTodo} onChange={e => updateApp(app.id, 'pricingTodo', e.target.checked)} />
                                    Pricing To-Do
                                  </label>
                                </div>
                                {!app.perSeat && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 11, color: '#64748b' }}>Annual Spend:</span>
                                    <InlineNum value={app.annualSpend} onChange={v => updateApp(app.id, 'annualSpend', v)} prefix="$" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Seat Allocation Grid — non-enterprise only */}
                            {app.tier !== 'enterprise' && depts.length > 0 && (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Seat Allocations</div>
                                <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${Math.min(depts.length, 6)}, 1fr)`, gap: 2 }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', padding: '4px 0' }}>Department</div>
                                  {depts.slice(0, 6).map(dept => (
                                    <div key={dept} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', padding: '4px 4px', textAlign: 'center' }}>
                                      {dept.length > 20 ? dept.slice(0, 18) + '…' : dept}
                                    </div>
                                  ))}
                                  {/* If more than 6 departments, show in rows */}
                                  {depts.length <= 6 ? (
                                    <>
                                      <div style={{ fontSize: 11, color: '#475569', padding: '4px 0' }}>Seats</div>
                                      {depts.map(dept => (
                                        <EditableCell
                                          key={dept}
                                          value={allocations[`${dept}|${app.id}`] || 0}
                                          onChange={v => setAllocation(dept, app.id, v)}
                                          maxSeats={1500}
                                        />
                                      ))}
                                    </>
                                  ) : null}
                                </div>
                                {depts.length > 6 && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '180px 80px', gap: '2px 8px', marginTop: 8 }}>
                                    {depts.map(dept => (
                                      <React.Fragment key={dept}>
                                        <div style={{ fontSize: 11, color: '#475569', padding: '2px 0' }}>
                                          {dept.length > 25 ? dept.slice(0, 23) + '…' : dept}
                                        </div>
                                        <EditableCell
                                          value={allocations[`${dept}|${app.id}`] || 0}
                                          onChange={v => setAllocation(dept, app.id, v)}
                                          maxSeats={1500}
                                        />
                                      </React.Fragment>
                                    ))}
                                  </div>
                                )}
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                                  Total allocated: {seats.toLocaleString()} seats
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={5} style={{ ...S.td, fontWeight: 600, fontSize: 12 }}>{filteredApps.length} app(s)</td>
              <td style={{ ...S.tdMono, fontWeight: 700 }}>{fmtCurrency(filteredTotal, monthly)}</td>
              <td style={S.td}></td>
            </tr>
          </tfoot>
        </table>

        {/* Add Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={S.btnPrimary} onClick={() => addApp('enterprise')}>+ Add Enterprise App</button>
          <button style={{ ...S.btnPrimary, background: '#6366f1' }} onClick={() => addApp('division')}>+ Add Specialist App</button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Enterprise', type: 'enterprise' },
            { label: 'Per-seat', type: 'per-seat' },
            { label: 'Flat-fee', type: 'flat-fee' },
            { label: 'Shared', type: 'shared' },
            { label: 'To-do', type: 'todo' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Badge type={l.type}>{l.label}</Badge>
            </div>
          ))}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={S.settingsPanel}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Division Headcounts</div>
                {divisions.map(div => (
                  <NumberInput
                    key={div.name}
                    label={div.name}
                    value={div.headcount}
                    onChange={v => updateDivHeadcount(div.name, v)}
                    min={0}
                    style={{ marginBottom: 8 }}
                  />
                ))}
                <div style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#475569', marginTop: 8 }}>
                  Total: {getTotalHeadcount(divisions).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Currency Conversion Rates</div>
                <NumberInput label="USD → AUD" value={fx.USD} onChange={v => setFx(prev => ({ ...prev, USD: v }))} step={0.01} style={{ marginBottom: 8 }} />
                <NumberInput label="EUR → AUD" value={fx.EUR} onChange={v => setFx(prev => ({ ...prev, EUR: v }))} step={0.01} style={{ marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <button
                    style={S.btnPrimary}
                    onClick={() => setFxStamp(new Date().toISOString().slice(0, 16).replace('T', ' '))}
                  >Stamp</button>
                  {fxStamp && <span style={{ fontSize: 11, color: '#64748b' }}>Last updated: {fxStamp}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowImport(false)}>
          <ImportModalInline onImport={handleImport} onClose={() => setShowImport(false)} />
        </div>
      )}
    </div>
  )
}

// ── Inline Import Modal (avoids require()) ──────────────────────────────────

function ImportModalInline({ onImport, onClose }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState([])
  const fileRef = React.useRef()

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file.'])
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result)
      const result = validateImport(rows)
      setPreview(result)
      setErrors(result.errors)
    }
    reader.readAsText(f)
  }

  return (
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
          borderRadius: 8, padding: 40, textAlign: 'center', cursor: 'pointer',
          background: dragOver ? '#eff6ff' : '#f8fafc', marginBottom: 16,
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
          {errors.map((err, i) => <div key={i} style={{ fontSize: 12, color: '#991b1b' }}>{err}</div>)}
        </div>
      )}

      {preview && preview.apps.length > 0 && errors.length === 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Ready to import {preview.apps.length} apps</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
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
  )
}
