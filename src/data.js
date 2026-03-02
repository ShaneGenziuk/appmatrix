// ── Organisation Structure ──────────────────────────────────────────────────

export const DIVISIONS = [
  {
    name: 'Wealth Accounting',
    departments: [
      'Accounting & Business Advisory',
      'HR & HS Solutions',
      'Payroll Solutions',
      'SMSF Administration & Advisory',
      'Wealth Management',
    ],
    headcount: 1696,
  },
  {
    name: 'Audit & Advisory',
    departments: [
      'Advisory & Consulting',
      'Internal/External/SMSF Audit',
    ],
    headcount: 620,
  },
  {
    name: 'Corporate',
    departments: [
      'Commercial Excellence',
      'DigiTech',
      'Finance',
      'Growth',
      'Centric',
      'Legal Risk & Compliance',
      'Marketing',
      'Operations - Front of House',
      'People & Culture',
      'Project Management Office',
      'Property & Procurement',
      'Virtual Centre of Excellence',
    ],
    headcount: 449,
  },
]

export const ALL_DEPARTMENTS = DIVISIONS.flatMap(d => d.departments)

export const DEFAULT_TOTAL_HEADCOUNT = 2765

// ── Currency Defaults ───────────────────────────────────────────────────────

export const DEFAULT_FX = { USD: 1.56, EUR: 1.72 }

// ── Application Inventory (57 apps) ─────────────────────────────────────────

export const DEFAULT_APPS = [
  // ── Enterprise (6) ──
  { id: 'e1', name: 'PDFDocs OCR', tier: 'enterprise', perSeat: true, annualPerSeat: 26, annualSpend: 3849, divisions: [], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'e2', name: 'Adobe Sign', tier: 'enterprise', perSeat: false, annualPerSeat: null, annualSpend: 143000, divisions: [], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'e3', name: 'Confluence', tier: 'enterprise', perSeat: false, annualPerSeat: null, annualSpend: 210000, divisions: [], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'e4', name: 'Oracle Fusion Cloud HCM', tier: 'enterprise', perSeat: true, annualPerSeat: 121, annualSpend: 370800, divisions: [], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: 'market', minVolume: null, extensionMonths: null },
  { id: 'e5', name: 'Ascender', tier: 'enterprise', perSeat: true, annualPerSeat: 45, annualSpend: 113000, divisions: [], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'e6', name: 'Concur', tier: 'enterprise', perSeat: false, annualPerSeat: null, annualSpend: 200587, divisions: [], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },

  // ── Shared (4) ──
  { id: 'sh1', name: 'NowInfinity', tier: 'shared', perSeat: false, annualPerSeat: null, annualSpend: 1123768, divisions: ['Wealth Accounting', 'Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: '2026-11-01', termMonths: 12, escalationRate: null, escalationType: 'cpi', minVolume: null, extensionMonths: null },
  { id: 'sh2', name: 'APS', tier: 'shared', perSeat: false, annualPerSeat: null, annualSpend: 852002, divisions: ['Wealth Accounting', 'Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'sh3', name: 'iManage', tier: 'shared', perSeat: false, annualPerSeat: null, annualSpend: 568260, divisions: ['Wealth Accounting', 'Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'sh4', name: 'Automation Anywhere', tier: 'shared', perSeat: false, annualPerSeat: null, annualSpend: 200000, divisions: ['Wealth Accounting', 'Audit & Advisory', 'Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },

  // ── Wealth Accounting (17) ──
  { id: 'wa1', name: 'Phoenix - AgData', tier: 'division', perSeat: true, annualPerSeat: 417, annualSpend: 7094, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa2', name: 'Common Ledger', tier: 'division', perSeat: true, annualPerSeat: 295, annualSpend: 355000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa3', name: 'Seamless SMSF Audit', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 900000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa4', name: 'OMNIMax', tier: 'division', perSeat: true, annualPerSeat: 11856, annualSpend: 23712, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa5', name: 'Padua', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 1954128, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: '2027-12-01', termMonths: 36, escalationRate: null, escalationType: 'locked', minVolume: null, extensionMonths: null },
  { id: 'wa6', name: 'Benchmarking', tier: 'division', perSeat: true, annualPerSeat: 625, annualSpend: 5000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa7', name: 'ASF Audits - SMSF', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 525000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa8', name: 'Enzumo AUS', tier: 'division', perSeat: true, annualPerSeat: 972, annualSpend: 112800, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa9', name: 'Enzumo NZ', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 8640, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa10', name: 'Morningstar (ARC)', tier: 'division', perSeat: true, annualPerSeat: 1914, annualSpend: 268000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa11', name: 'Accurium', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 176000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa12', name: 'Active by Business Fitness', tier: 'division', perSeat: true, annualPerSeat: 676, annualSpend: 812000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: '2026-10-15', termMonths: 12, escalationRate: 3.0, escalationType: 'fixed', minVolume: null, extensionMonths: 2 },
  { id: 'wa13', name: 'FinaMetrica', tier: 'division', perSeat: true, annualPerSeat: 451, annualSpend: 49660, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa14', name: 'MYOB Cloud Accounting', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 780000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa15', name: 'Steadfast Insight', tier: 'division', perSeat: true, annualPerSeat: 1260, annualSpend: 58000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'wa16', name: 'IRESS Xplan', tier: 'division', perSeat: true, annualPerSeat: 5083, annualSpend: 2068351, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: '2026-09-01', termMonths: 36, escalationRate: 4.0, escalationType: 'fixed', minVolume: 350, extensionMonths: null },
  { id: 'wa17', name: 'Class', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 1080000, divisions: ['Wealth Accounting'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },

  // ── Audit & Advisory (15) ──
  { id: 'aa1', name: 'CCH Integrator', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 20889, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa2', name: 'Retain Cloud', tier: 'division', perSeat: true, annualPerSeat: 1739, annualSpend: 125000, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa3', name: 'Intralinks VDR', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 35000, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa4', name: 'Westlaw', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 4852, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa5', name: 'S&P Capital IQ', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 150000, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa6', name: 'Inflo Analytics', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 24000, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa7', name: 'IBISWorld', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 82977, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa8', name: 'Mergermarket & Debtwire', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 43000, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa9', name: 'TR Connect 4', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 10854, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa10', name: 'Safeguard Plus', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 266, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa11', name: 'Cloudoffis', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 60000, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa12', name: 'Datasnipper', tier: 'division', perSeat: true, annualPerSeat: 317, annualSpend: 158760, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'EUR', renewalDate: '2026-03-01', termMonths: 24, escalationRate: null, escalationType: 'locked', minVolume: null, extensionMonths: null },
  { id: 'aa13', name: 'Caseware', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 556642, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: '2026-07-15', termMonths: 12, escalationRate: null, escalationType: 'cpi', minVolume: null, extensionMonths: null },
  { id: 'aa14', name: 'TR OneSource FBT', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 11359, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'aa15', name: 'Taxlab', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 0, divisions: ['Audit & Advisory'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },

  // ── Corporate (15) ──
  { id: 'co1', name: 'Agiloft CLM', tier: 'division', perSeat: true, annualPerSeat: 1815, annualSpend: 27225, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co2', name: 'Eftsure', tier: 'division', perSeat: true, annualPerSeat: 1070, annualSpend: 9600, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co3', name: 'Xref', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 22350, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co4', name: 'AplyID', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 62340, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co5', name: 'Articulate 360', tier: 'division', perSeat: true, annualPerSeat: 2000, annualSpend: 8100, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co6', name: 'SmartSalary', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 53580, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co7', name: 'Whatfix', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 32000, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co8', name: 'Protecht', tier: 'division', perSeat: true, annualPerSeat: 10000, annualSpend: 215700, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co9', name: 'Adaptive Insights', tier: 'division', perSeat: true, annualPerSeat: 1902, annualSpend: 140804, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co10', name: 'MYOB Advanced', tier: 'division', perSeat: true, annualPerSeat: 2284, annualSpend: 123372, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co11', name: 'FACTS Management', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 0, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co12', name: 'FeeSynergy', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 0, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co13', name: 'First Advantage', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 0, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co14', name: 'Spotlight Reporting', tier: 'division', perSeat: false, annualPerSeat: null, annualSpend: 74232, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
  { id: 'co15', name: 'Tribal Habits', tier: 'division', perSeat: true, annualPerSeat: 19, annualSpend: 64680, divisions: ['Corporate'], pricingTodo: false, currency: 'AUD', renewalDate: null, termMonths: null, escalationRate: null, escalationType: null, minVolume: null, extensionMonths: null },
]

// ── Default Seat Allocations ────────────────────────────────────────────────

export const DEFAULT_ALLOCATIONS = {}

// ── Default Scenario ────────────────────────────────────────────────────────

export const DEFAULT_SCENARIO = {
  id: 'sc1',
  name: 'FY27 Budget Model',
  notes: '',
  rates: {
    cpi: 3.5,
    ppi: 2.2,
    usdShift: 0,
    eurShift: 0,
    hcGrowth: 5.0,
  },
  overrides: {},
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getDivisionsForApp(app) {
  if (app.tier === 'enterprise') return DIVISIONS.map(d => d.name)
  return app.divisions
}

export function getDepartmentsForApp(app) {
  const divNames = getDivisionsForApp(app)
  return DIVISIONS.filter(d => divNames.includes(d.name)).flatMap(d => d.departments)
}

export function getTotalHeadcount(divisions) {
  return divisions.reduce((sum, d) => sum + d.headcount, 0)
}

export function getDivisionHeadcount(divisions, divName) {
  const div = divisions.find(d => d.name === divName)
  return div ? div.headcount : 0
}
