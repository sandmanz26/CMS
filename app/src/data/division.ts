// Sales division, analytics series, master data and per-role data access rules.

export type SalesTeam = { id: string; name: string; manager: string; region: string; members: string[]; pipeline: number; winRate: number; cycle: number; avgDeal: number; activities: number }
export const teams: SalesTeam[] = [
  { id: "tm1", name: "West team", manager: "r1", region: "Greater Jakarta & West Java", members: ["r1", "r2"], pipeline: 6_400_000_000, winRate: 34, cycle: 29, avgDeal: 168_000_000, activities: 412 },
  { id: "tm2", name: "East team", manager: "r3", region: "Central & East Java, Bali–NT", members: ["r3", "r5"], pipeline: 3_150_000_000, winRate: 29, cycle: 36, avgDeal: 121_000_000, activities: 318 },
  { id: "tm3", name: "Outer islands team", manager: "r7", region: "Sumatra, Kalimantan, Sulawesi, Papua", members: ["r4", "r6", "r7"], pipeline: 2_880_000_000, winRate: 22, cycle: 44, avgDeal: 96_000_000, activities: 276 },
]

// Weekly activity per rep (Mon–Fri): calls + meetings + visits + emails
export const activityHeat: Record<string, number[]> = {
  r1: [14, 18, 12, 16, 9], r2: [17, 21, 19, 15, 12], r3: [11, 9, 14, 12, 8], r4: [6, 5, 8, 4, 3],
  r5: [13, 15, 12, 14, 10], r6: [0, 0, 0, 0, 0], r7: [10, 12, 9, 11, 7],
}

export type RepScore = { id: string; calls: number; meetings: number; visits: number; emails: number; winRate: number; cycle: number; coverage: number; lastLogin: string }
export const repScores: RepScore[] = [
  { id: "r1", calls: 46, meetings: 14, visits: 9, emails: 92, winRate: 36, cycle: 27, coverage: 3.4, lastLogin: "Today 08:41" },
  { id: "r2", calls: 58, meetings: 19, visits: 12, emails: 104, winRate: 38, cycle: 25, coverage: 3.1, lastLogin: "Today 08:12" },
  { id: "r3", calls: 39, meetings: 11, visits: 6, emails: 77, winRate: 30, cycle: 33, coverage: 2.6, lastLogin: "Today 09:05" },
  { id: "r4", calls: 18, meetings: 4, visits: 2, emails: 31, winRate: 19, cycle: 48, coverage: 1.4, lastLogin: "Yesterday 16:20" },
  { id: "r5", calls: 44, meetings: 13, visits: 10, emails: 69, winRate: 33, cycle: 31, coverage: 2.9, lastLogin: "Today 07:58" },
  { id: "r6", calls: 0, meetings: 0, visits: 0, emails: 2, winRate: 21, cycle: 46, coverage: 1.1, lastLogin: "12 days ago" },
  { id: "r7", calls: 36, meetings: 10, visits: 7, emails: 58, winRate: 27, cycle: 39, coverage: 2.2, lastLogin: "Today 08:30" },
]

export type AlertLevel = "critical" | "warning" | "info"
export type Alert = { id: string; level: AlertLevel; title: string; detail: string; link: string }
export const staticAlerts: Alert[] = [
  { id: "al1", level: "critical", title: "Dimas's pipeline coverage is only 1.4×", detail: "At least 3× the remaining target is needed. Short by about Rp 520M of new pipeline.", link: "/pipeline" },
  { id: "al2", level: "critical", title: "2 invoices are overdue", detail: "Tirta Logistik and Mitra Klinik haven't paid installments that are past due.", link: "/invoices" },
  { id: "al4", level: "warning", title: "4 approvals waiting > 24 hours", detail: "Discount, custom term and credit limit requests need a decision.", link: "/approvals" },
  { id: "al5", level: "info", title: "Fajar Nugroho is on leave", detail: "His Kalimantan leads should be reassigned temporarily.", link: "/leads?owner=r6" },
]

// Analytics
export const winLoss = [{ name: "Won", value: 79 }, { name: "Lost", value: 112 }, { name: "Open", value: 168 }]
export const lossReasons = [
  { reason: "Price too high", count: 38 }, { reason: "Chose a competitor", count: 27 }, { reason: "No budget", count: 21 },
  { reason: "Bad timing", count: 16 }, { reason: "Unresponsive", count: 10 },
]
export const productMix = [{ name: "Subscription", value: 2_840 }, { name: "Services", value: 1_120 }, { name: "Hardware", value: 760 }]
export const pipelineTrend = [
  { m: "May", Prospecting: 820, Qualification: 610, Proposal: 420, Negotiation: 260 },
  { m: "Jun", Prospecting: 900, Qualification: 640, Proposal: 470, Negotiation: 290 },
  { m: "Jul", Prospecting: 870, Qualification: 700, Proposal: 455, Negotiation: 310 },
  { m: "Aug", Prospecting: 960, Qualification: 720, Proposal: 520, Negotiation: 340 },
  { m: "Sep", Prospecting: 1040, Qualification: 790, Proposal: 560, Negotiation: 380 },
  { m: "Oct", Prospecting: 1110, Qualification: 820, Proposal: 610, Negotiation: 395 },
]
export const activityTrend = [
  { w: "Sep W1", Visit: 31, Meeting: 48, Call: 182, Email: 340 }, { w: "Sep W2", Visit: 36, Meeting: 55, Call: 201, Email: 362 },
  { w: "Sep W3", Visit: 29, Meeting: 51, Call: 176, Email: 318 }, { w: "Sep W4", Visit: 41, Meeting: 63, Call: 214, Email: 377 },
  { w: "Oct W1", Visit: 38, Meeting: 59, Call: 198, Email: 351 }, { w: "Oct W2", Visit: 44, Meeting: 66, Call: 223, Email: 389 },
  { w: "Oct W3", Visit: 47, Meeting: 71, Call: 241, Email: 402 },
]

// Master data used across forms
export const masterData: Record<string, { label: string; desc: string; values: string[] }> = {
  source: { label: "Lead sources", desc: "Where a lead came from — used in forms and conversion reports.", values: ["Website", "Referral", "LinkedIn", "Event", "Cold outreach", "Meta Ads", "Google Ads"] },
  industry: { label: "Industries", desc: "Account segmentation for reports and targeting.", values: ["Retail", "F&B", "Logistics", "Technology", "Agriculture", "Education", "Healthcare", "Media", "Property", "Automotive", "Hospitality", "Manufacturing"] },
  lost: { label: "Lost reasons", desc: "Required when a deal is marked lost.", values: ["Price too high", "Chose a competitor", "No budget", "Bad timing", "Unresponsive", "Not a fit"] },
  transfer: { label: "Reassignment reasons", desc: "Required when a lead changes owner.", values: ["Rep on leave", "Territory realignment", "Workload balancing", "Customer request", "Rep left the company", "Better product expertise"] },
  category: { label: "Product categories", desc: "Catalog and price list grouping.", values: ["Subscription", "Services", "Hardware"] },
  unit: { label: "Units", desc: "Pricing units for products.", values: ["user/mo", "package", "project", "unit"] },
  tax: { label: "Tax rates", desc: "Rates selectable on quotes and invoices.", values: ["VAT 11%", "VAT 12% (luxury goods)", "VAT exempt"] },
}

// What each role may carry to their device (offline), export, or download
export const dataScopes = [
  { key: "leads", label: "Leads & contacts", desc: "Name, company, phone, email" },
  { key: "deals", label: "Deals & pipeline", desc: "Value, stage, next step" },
  { key: "accounts", label: "Customer accounts", desc: "Profile, transaction history" },
  { key: "products", label: "Catalog & price list", desc: "Selling price, stock" },
  { key: "content", label: "Sales materials", desc: "Decks, brochures, case studies" },
  { key: "invoices", label: "Invoices & receivables", desc: "Payment status, installments" },
] as const
export type ScopeKey = (typeof dataScopes)[number]["key"]
export type CarryRule = { offline: boolean; export: boolean; maxRows: number; days: number }
export const carryRules: Record<string, Record<ScopeKey, CarryRule>> = {
  "Sales Rep": {
    leads: { offline: true, export: false, maxRows: 0, days: 30 }, deals: { offline: true, export: false, maxRows: 0, days: 30 },
    accounts: { offline: true, export: false, maxRows: 0, days: 30 }, products: { offline: true, export: true, maxRows: 500, days: 7 },
    content: { offline: true, export: true, maxRows: 0, days: 14 }, invoices: { offline: false, export: false, maxRows: 0, days: 0 },
  },
  "Senior AE": {
    leads: { offline: true, export: true, maxRows: 200, days: 60 }, deals: { offline: true, export: true, maxRows: 200, days: 60 },
    accounts: { offline: true, export: true, maxRows: 200, days: 60 }, products: { offline: true, export: true, maxRows: 500, days: 14 },
    content: { offline: true, export: true, maxRows: 0, days: 30 }, invoices: { offline: true, export: false, maxRows: 0, days: 30 },
  },
  "Sales Manager": {
    leads: { offline: true, export: true, maxRows: 2000, days: 90 }, deals: { offline: true, export: true, maxRows: 2000, days: 90 },
    accounts: { offline: true, export: true, maxRows: 2000, days: 90 }, products: { offline: true, export: true, maxRows: 2000, days: 30 },
    content: { offline: true, export: true, maxRows: 0, days: 30 }, invoices: { offline: true, export: true, maxRows: 1000, days: 60 },
  },
}
export const sensitiveFields = [
  { key: "cost", label: "Cost price & margin", roles: ["Sales Manager"] },
  { key: "commission", label: "Other reps' commission", roles: [] as string[] },
  { key: "phone", label: "Contact's personal phone", roles: ["Sales Rep", "Senior AE", "Sales Manager"] },
  { key: "credit", label: "Customer credit limit", roles: ["Senior AE", "Sales Manager"] },
  { key: "npwp", label: "Tax ID (NPWP) & legal docs", roles: ["Sales Manager"] },
]
export const devices = [
  { id: "dv1", user: "r2", device: "iPhone 15 · iOS 19", lastSync: "Today 08:12", records: 1240, status: "Active" },
  { id: "dv2", user: "r5", device: "Samsung A55 · Android 16", lastSync: "Today 07:58", records: 860, status: "Active" },
  { id: "dv3", user: "r4", device: "Xiaomi 14 · Android 16", lastSync: "Yesterday 16:20", records: 702, status: "Active" },
  { id: "dv4", user: "r6", device: "iPhone 13 · iOS 18", lastSync: "12 days ago", records: 655, status: "Needs review" },
]
