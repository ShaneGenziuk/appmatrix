import { getTotalHeadcount } from './data.js'

// FY27 = Jul 2026 – Jun 2027
const FY_START = new Date(2026, 6, 1) // Jul 1 2026
const FY_END = new Date(2027, 5, 30)   // Jun 30 2027

// ── Cost Helpers ────────────────────────────────────────────────────────────

export function fxMultiplier(currency, fx) {
  if (currency === 'USD') return fx.USD
  if (currency === 'EUR') return fx.EUR
  return 1
}

export function computeAppCost(app, divisions, allocations, fx) {
  const fxm = fxMultiplier(app.currency, fx)
  if (app.perSeat) {
    if (app.tier === 'enterprise') {
      return app.annualPerSeat * getTotalHeadcount(divisions) * fxm
    }
    const totalSeats = getTotalSeats(app, allocations)
    return app.annualPerSeat * totalSeats * fxm
  }
  return app.annualSpend * fxm
}

export function getTotalSeats(app, allocations) {
  let total = 0
  for (const key of Object.keys(allocations)) {
    if (key.endsWith(`|${app.id}`)) {
      total += allocations[key] || 0
    }
  }
  return total
}

// ── Single-Year Projection ──────────────────────────────────────────────────

export function computeScenario(apps, divisions, allocations, fx, scenario) {
  const { rates, overrides } = scenario
  const totalHC = getTotalHeadcount(divisions)
  const projectedHC = Math.round(totalHC * (1 + rates.hcGrowth / 100))

  return apps.map(app => {
    const currentCost = computeAppCost(app, divisions, allocations, fx)

    // 1. Manual override
    if (overrides[app.id] != null) {
      const projected = overrides[app.id]
      return {
        app,
        current: currentCost,
        projected,
        delta: projected - currentCost,
        driver: 'Manual override',
        driverCategory: 'override',
      }
    }

    // 2. Locked escalation — check if term expires within FY27
    if (app.escalationType === 'locked') {
      if (app.renewalDate && app.termMonths) {
        const renewal = new Date(app.renewalDate)
        const termEnd = new Date(renewal)
        termEnd.setMonth(termEnd.getMonth() + app.termMonths)
        if (termEnd > FY_END) {
          return {
            app,
            current: currentCost,
            projected: currentCost,
            delta: 0,
            driver: 'Locked — within term',
            driverCategory: 'locked',
          }
        }
      } else {
        return {
          app,
          current: currentCost,
          projected: currentCost,
          delta: 0,
          driver: 'Locked — within term',
          driverCategory: 'locked',
        }
      }
    }

    // 3. Determine escalation rate
    let escRate = 0
    let driverCategory = 'market'
    let driver = ''

    if (app.escalationType === 'fixed' && app.escalationRate != null) {
      escRate = app.escalationRate / 100
      driverCategory = 'fixed'
      driver = `Fixed contractual ${app.escalationRate}%`
    } else if (app.escalationType === 'cpi') {
      escRate = rates.cpi / 100
      driverCategory = 'cpi'
      driver = `CPI escalation ${rates.cpi}%`
    } else if (app.escalationType === 'ppi') {
      escRate = rates.ppi / 100
      driverCategory = 'ppi'
      driver = `PPI escalation ${rates.ppi}%`
    } else if (app.escalationType === 'market' || !app.escalationType) {
      // Market defaults: CPI for flat-fee, PPI for per-seat
      if (app.perSeat) {
        escRate = rates.ppi / 100
        driverCategory = 'market'
        driver = `Market (PPI default ${rates.ppi}%)`
      } else {
        escRate = rates.cpi / 100
        driverCategory = 'market'
        driver = `Market (CPI default ${rates.cpi}%)`
      }
    }

    // 4. Determine effective date (renewal + extension)
    let effectiveMonth = 0 // months into FY when new rate kicks in (0 = July)
    let monthsAtNew = 12
    let monthsAtOld = 0

    if (app.renewalDate) {
      const renewal = new Date(app.renewalDate)
      const extensionMs = (app.extensionMonths || 0) * 30 * 24 * 60 * 60 * 1000
      const effectiveDate = new Date(renewal.getTime() + extensionMs)

      if (effectiveDate > FY_END) {
        // New rate doesn't kick in this FY
        monthsAtNew = 0
        monthsAtOld = 12
      } else if (effectiveDate <= FY_START) {
        monthsAtNew = 12
        monthsAtOld = 0
      } else {
        // Pro-rate within FY
        const diffMs = effectiveDate.getTime() - FY_START.getTime()
        monthsAtOld = Math.max(0, Math.min(12, Math.round(diffMs / (30 * 24 * 60 * 60 * 1000))))
        monthsAtNew = 12 - monthsAtOld
      }
      effectiveMonth = monthsAtOld
    }

    // 5. Calculate new annual cost
    let fxm = fxMultiplier(app.currency, fx)

    // Apply FX shift
    let fxShift = 0
    if (app.currency === 'USD') fxShift = rates.usdShift / 100
    if (app.currency === 'EUR') fxShift = rates.eurShift / 100
    const newFxm = fxm * (1 + fxShift)

    let newAnnualCost
    if (app.perSeat) {
      const newRate = app.annualPerSeat * (1 + escRate)
      if (app.tier === 'enterprise') {
        newAnnualCost = newRate * projectedHC * newFxm
      } else {
        const seats = getTotalSeats(app, allocations)
        newAnnualCost = newRate * seats * newFxm
      }
    } else {
      newAnnualCost = app.annualSpend * (1 + escRate) * newFxm
    }

    // 6. Blend old and new
    const projected = (monthsAtOld / 12) * currentCost + (monthsAtNew / 12) * newAnnualCost

    // Determine primary driver
    const fxDelta = app.currency !== 'AUD' && fxShift !== 0
    const hcDelta = app.tier === 'enterprise' && app.perSeat && rates.hcGrowth !== 0
    let drivers = [driver]
    if (hcDelta) drivers.push(`HC growth ${rates.hcGrowth}%`)
    if (fxDelta) drivers.push(`FX shift ${app.currency}`)

    return {
      app,
      current: currentCost,
      projected,
      delta: projected - currentCost,
      driver: drivers.join(' + '),
      driverCategory,
      monthsAtOld,
      monthsAtNew,
      effectiveMonth,
    }
  })
}

// ── 3-Year Outlook ──────────────────────────────────────────────────────────

export function projectMultiYear(apps, divisions, allocations, fx, scenario) {
  const { rates, overrides } = scenario
  const totalHC = getTotalHeadcount(divisions)
  const years = [0, 1, 2, 3]

  const yearData = years.map(year => {
    let totalSpend = 0
    let lockedSpend = 0
    const hcFactor = Math.pow(1 + rates.hcGrowth / 100, year)
    const hc = Math.round(totalHC * hcFactor)

    apps.forEach(app => {
      const baseCost = computeAppCost(app, divisions, allocations, fx)

      if (year === 0) {
        totalSpend += baseCost
        if (app.escalationType === 'locked') lockedSpend += baseCost
        return
      }

      // Override only applies in year 1
      if (year === 1 && overrides[app.id] != null) {
        totalSpend += overrides[app.id]
        return
      }

      let escRate = 0
      if (app.escalationType === 'fixed' && app.escalationRate != null) {
        escRate = app.escalationRate / 100
      } else if (app.escalationType === 'cpi') {
        escRate = rates.cpi / 100
      } else if (app.escalationType === 'ppi') {
        escRate = rates.ppi / 100
      } else if (app.escalationType === 'locked') {
        // Check if still within term
        if (app.renewalDate && app.termMonths) {
          const renewal = new Date(app.renewalDate)
          const termEnd = new Date(renewal)
          termEnd.setMonth(termEnd.getMonth() + app.termMonths)
          const fyStart = new Date(2026 + year, 6, 1)
          if (termEnd > fyStart) {
            totalSpend += baseCost
            lockedSpend += baseCost
            return
          }
          // Past term — face market rates
          escRate = app.perSeat ? rates.ppi / 100 : rates.cpi / 100
        } else {
          totalSpend += baseCost
          lockedSpend += baseCost
          return
        }
      } else {
        escRate = app.perSeat ? rates.ppi / 100 : rates.cpi / 100
      }

      let fxShift = 0
      if (app.currency === 'USD') fxShift = rates.usdShift / 100
      if (app.currency === 'EUR') fxShift = rates.eurShift / 100
      const fxFactor = Math.pow(1 + fxShift, year)

      let cost
      if (app.perSeat && app.tier === 'enterprise') {
        cost = app.annualPerSeat * Math.pow(1 + escRate, year) * hc * fxMultiplier(app.currency, fx) * fxFactor
      } else if (app.perSeat) {
        const seats = getTotalSeats(app, allocations)
        cost = app.annualPerSeat * Math.pow(1 + escRate, year) * seats * fxMultiplier(app.currency, fx) * fxFactor
      } else {
        cost = app.annualSpend * Math.pow(1 + escRate, year) * fxMultiplier(app.currency, fx) * fxFactor
      }

      totalSpend += cost
    })

    return { year, totalSpend, lockedSpend, headcount: hc }
  })

  return yearData
}

// ── Renewal Timeline ────────────────────────────────────────────────────────

export function buildTimeline(apps, divisions, allocations, fx) {
  // Top 15 apps by spend > $10K
  const withCost = apps
    .map(app => ({ app, cost: computeAppCost(app, divisions, allocations, fx) }))
    .filter(x => x.cost > 10000)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 15)

  return withCost.map(({ app, cost }) => {
    let newRateMonth = null
    let extensionEnd = null

    if (app.renewalDate) {
      const renewal = new Date(app.renewalDate)
      const extensionMs = (app.extensionMonths || 0) * 30 * 24 * 60 * 60 * 1000
      const effectiveDate = new Date(renewal.getTime() + extensionMs)

      if (effectiveDate >= FY_START && effectiveDate <= FY_END) {
        const diffMs = effectiveDate.getTime() - FY_START.getTime()
        newRateMonth = Math.max(0, Math.min(12, Math.round(diffMs / (30 * 24 * 60 * 60 * 1000))))
      } else if (effectiveDate < FY_START) {
        newRateMonth = 0
      }
      // If after FY_END, newRateMonth stays null = entire year at current rate

      if (app.extensionMonths) {
        const extDate = new Date(renewal.getTime() + extensionMs)
        if (extDate >= FY_START && extDate <= FY_END) {
          const diffMs2 = extDate.getTime() - FY_START.getTime()
          extensionEnd = Math.round(diffMs2 / (30 * 24 * 60 * 60 * 1000))
        }
      }
    }

    return {
      app,
      cost,
      newRateMonth,
      extensionEnd,
      hasDate: !!app.renewalDate,
    }
  })
}

// ── Waterfall (Cost Driver Breakdown) ───────────────────────────────────────

export function buildWaterfall(projections) {
  const categories = {
    fixed: { label: 'Fixed contractual', color: '#ef4444', delta: 0 },
    cpi: { label: 'CPI escalation', color: '#f59e0b', delta: 0 },
    ppi: { label: 'PPI escalation', color: '#3b82f6', delta: 0 },
    market: { label: 'Market / Unknown', color: '#6b7280', delta: 0 },
    hc: { label: 'Headcount growth', color: '#6366f1', delta: 0 },
    fx: { label: 'FX shift', color: '#a855f7', delta: 0 },
    locked: { label: 'Locked (no change)', color: '#22c55e', delta: 0 },
    override: { label: 'Manual overrides', color: '#a855f7', delta: 0 },
  }

  projections.forEach(p => {
    if (p.driverCategory === 'override') {
      categories.override.delta += p.delta
    } else if (p.driverCategory === 'locked') {
      categories.locked.delta += p.delta
    } else {
      // Primary escalation bucket
      if (categories[p.driverCategory]) {
        categories[p.driverCategory].delta += p.delta
      }
    }
  })

  return Object.entries(categories)
    .map(([key, val]) => ({ key, ...val }))
    .filter(c => Math.abs(c.delta) > 0.01 || c.key === 'locked')
}
