// Core sales mock data: team, leads (ownership, quality, territory, activity history), pipeline + stage checkpoints.
import { seeded } from "@/lib/store"
import { TODAY, addDays } from "@/lib/format"
import { areaOfCity, cityCoords } from "./geo"

/* ───────────────────────── Team ───────────────────────── */

export type Role = "Sales Rep" | "Senior AE" | "Sales Manager" | "Admin"
export type RepStatus = "Active" | "On leave" | "Inactive"
export type Rep = { id: string; name: string; email: string; phone: string; role: Role; areas: string[]; status: RepStatus; joined: string; managerId?: string }

export const reps: Rep[] = [
  { id: "r1", name: "Andini Pratama", email: "andini@bluesilo.id", phone: "+62 811-2041-337", role: "Sales Manager", areas: ["jkt"], status: "Active", joined: "2021-03-01" },
  { id: "r2", name: "Bima Saputra", email: "bima@bluesilo.id", phone: "+62 812-5530-118", role: "Senior AE", areas: ["wjv"], status: "Active", joined: "2022-01-10", managerId: "r1" },
  { id: "r3", name: "Citra Maharani", email: "citra@bluesilo.id", phone: "+62 813-7781-902", role: "Senior AE", areas: ["ejv", "cjv"], status: "Active", joined: "2022-06-20", managerId: "r1" },
  { id: "r4", name: "Dimas Wijaya", email: "dimas@bluesilo.id", phone: "+62 821-4412-650", role: "Sales Rep", areas: ["nsm", "ssm"], status: "Active", joined: "2024-02-05", managerId: "r7" },
  { id: "r5", name: "Eka Lestari", email: "eka@bluesilo.id", phone: "+62 822-9012-334", role: "Sales Rep", areas: ["bnt"], status: "Active", joined: "2023-08-14", managerId: "r3" },
  { id: "r6", name: "Fajar Nugroho", email: "fajar@bluesilo.id", phone: "+62 823-3307-781", role: "Sales Rep", areas: ["kal"], status: "On leave", joined: "2023-11-01", managerId: "r7" },
  { id: "r7", name: "Gita Anggraini", email: "gita@bluesilo.id", phone: "+62 857-6620-415", role: "Sales Manager", areas: ["sul", "pap"], status: "Active", joined: "2021-09-12" },
  { id: "r8", name: "Hendra Kusuma", email: "hendra@bluesilo.id", phone: "+62 811-9000-120", role: "Admin", areas: [], status: "Active", joined: "2020-05-04" },
]
export const sellers = reps.filter((r) => r.role !== "Admin")
export const repById = (id: string | null | undefined) => reps.find((r) => r.id === id)
export const repName = (id: string | null | undefined) => repById(id)?.name ?? "Unassigned"
/** The signed-in user for this mock (admin). */
export const ME = "r8"

/* ───────────────────────── Lead quality ───────────────────────── */

export type Fit = "Strong" | "Partial" | "Weak"
export type Grade = "A" | "B" | "C" | "D"
export const grades: Grade[] = ["A", "B", "C", "D"]
export const gradeMeta: Record<Grade, { label: string; desc: string }> = {
  A: { label: "Hot", desc: "Strong ICP fit and highly engaged. Contact within the SLA." },
  B: { label: "Warm", desc: "Good fit or engagement. Worth active follow-up." },
  C: { label: "Nurture", desc: "Early interest. Keep warm with content and check-ins." },
  D: { label: "Cold", desc: "Weak fit or no engagement. Low priority." },
}
export type QualityRules = { aMin: number; bMin: number; cMin: number; requireStrongFitForA: boolean; sla: Record<Grade, number> }
export const defaultQualityRules: QualityRules = { aMin: 75, bMin: 55, cMin: 35, requireStrongFitForA: true, sla: { A: 3, B: 7, C: 14, D: 30 } }
export const fitBonus: Record<Fit, number> = { Strong: 10, Partial: 0, Weak: -15 }

/** Grade = engagement score adjusted by ICP fit, then bucketed by the admin-defined thresholds. */
export function gradeOf(score: number, fit: Fit, rules: QualityRules): Grade {
  const adj = score + fitBonus[fit]
  if (adj >= rules.aMin && (!rules.requireStrongFitForA || fit === "Strong")) return "A"
  if (adj >= rules.bMin) return "B"
  if (adj >= rules.cMin) return "C"
  return "D"
}

/* ───────────────────────── Leads ───────────────────────── */

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Unqualified" | "Converted"
export const leadStatuses: LeadStatus[] = ["New", "Contacted", "Qualified", "Unqualified", "Converted"]
export type Lead = {
  id: string; name: string; title: string; company: string; industry: string; email: string; phone: string; source: string
  status: LeadStatus; score: number; fit: Fit; owner: string | null; ownerSince: string | null
  city: string; area: string; coord: [number, number]; value: number; createdAt: string; nextFollowUp: string | null; tags: string[]
}

export type ActivityType = "Visit" | "Meeting" | "Call" | "Follow-up" | "Email" | "WhatsApp" | "Note"
export const activityTypes: ActivityType[] = ["Visit", "Meeting", "Call", "Follow-up", "Email", "WhatsApp", "Note"]
export type Outcome = "Positive" | "Neutral" | "No response" | "Negative"
export type Activity = { id: string; leadId: string; type: ActivityType; at: string; by: string; outcome: Outcome; note: string }

export const transferReasons = ["Rep on leave", "Territory realignment", "Workload balancing", "Customer request", "Rep left the company", "Better product expertise"] as const
export type Transfer = { id: string; leadId: string; from: string | null; to: string; at: string; by: string; reason: string; note: string }

const people = ["Rizky Firmansyah", "Sari Dewi", "Agus Hartono", "Maya Kusumawati", "Budi Santoso", "Lina Marlina", "Tono Wibowo", "Rina Susanti", "Yoga Pratama", "Nadia Putri", "Samuel Tan", "Wulan Sari", "Ivan Gunawan", "Putri Ayu", "Hadi Purnomo", "Dewi Anjani", "Reza Mahendra", "Kartika Sari", "Joko Prasetyo", "Anisa Rahma", "Michael Chandra", "Fitri Handayani", "Doni Setiawan", "Melati Kusuma", "Arief Budiman", "Clara Wijaya", "Fadli Rahman", "Gilang Ramadhan", "Hana Lestari", "Irfan Hakim", "Jessica Halim", "Kevin Sanjaya", "Laras Ayu", "Mario Siregar", "Nova Damanik", "Oki Setiana", "Pandu Wirawan", "Ratna Sari", "Sinta Nuriyah", "Taufik Hidayat", "Umar Said", "Vina Panduwinata"]
const companies = ["PT Maju Bersama", "CV Sinar Jaya", "Nusantara Retail", "Kopi Kelana", "Tirta Logistik", "Garuda Digital", "Bumi Agro", "Lentera Edu", "Samudra Foods", "Cakra Teknik", "Mitra Klinik", "Aksara Media", "Pelita Properti", "Rajawali Motor", "Cahaya Fashion", "Harmoni Hotel", "Sentosa Furniture", "Kreasi Printing", "Bintang Farma", "Delta Konstruksi", "Prima Gadget", "Surya Energi", "Tunas Muda", "Wahana Travel", "Arunika Cosmetics", "Bahtera Shipping", "Citra Kencana Mall", "Dwi Mitra Logistics", "Eka Sentosa Steel", "Fajar Agro Lestari", "Graha Medika", "Hijau Daun Organic", "Indo Kreatif Studio", "Jaya Abadi Electric", "Kencana Resort", "Laut Biru Seafood", "Mega Solusi IT", "Nusa Coffee Roasters", "Omega Packaging", "Permata Dental", "Quantum Edutech", "Rimba Timber"]
export const industries = ["Retail", "F&B", "Logistics", "Technology", "Agriculture", "Education", "Healthcare", "Media", "Property", "Automotive", "Hospitality", "Manufacturing"]
export const leadSources = ["Website", "Referral", "LinkedIn", "Event", "Cold outreach", "Meta Ads", "Google Ads"]
const titles = ["Owner", "Operations Manager", "Head of IT", "Procurement Lead", "Finance Director", "CEO", "Store Manager", "General Manager"]
// City per lead, spread across all territories
const leadCities = ["Jakarta", "Bandung", "Surabaya", "Medan", "Denpasar", "Makassar", "Tangerang", "Semarang", "Balikpapan", "Jakarta", "Malang", "Palembang", "Bekasi", "Yogyakarta", "Samarinda", "Manado", "Bogor", "Cirebon", "Pekanbaru", "Mataram", "Jakarta", "Solo", "Pontianak", "Banda Aceh", "Surabaya", "Jakarta", "Bandung", "Padang", "Kupang", "Palu", "Jakarta", "Banjarmasin", "Ambon", "Tangerang", "Bandar Lampung", "Jayapura", "Bandung", "Surabaya", "Denpasar", "Makassar", "Jakarta", "Semarang"]

const rnd = seeded(20261021)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]
const at = (daysBack: number, hour = 9 + Math.floor(rnd() * 8)) => `${addDays(TODAY, -daysBack)}T${String(hour).padStart(2, "0")}:${pick(["00", "15", "30", "45"])}:00`

/** Primary covering rep for an area (first active seller covering it). */
export const coveringRep = (areaId: string) => sellers.find((r) => r.areas.includes(areaId))

const UNASSIGNED = new Set([6, 17, 28, 35, 40])
const statusPlan: LeadStatus[] = ["Converted", "Qualified", "Contacted", "New", "Converted", "Contacted", "Qualified", "Unqualified", "Converted", "New", "Contacted", "Qualified"]

const seedLeads: Lead[] = people.map((name, i) => {
  const city = leadCities[i]
  const area = areaOfCity(city).id
  const [lon, lat] = cityCoords[city]
  const owner = UNASSIGNED.has(i) ? null : coveringRep(area)?.id ?? null
  const fit: Fit = i % 5 === 0 ? "Strong" : i % 5 === 3 ? "Weak" : rnd() > 0.45 ? "Strong" : "Partial"
  const status = UNASSIGNED.has(i) ? "New" : statusPlan[i % statusPlan.length]
  const company = companies[i]
  return {
    id: `L-${1001 + i}`, name, title: titles[i % titles.length], company, industry: industries[i % industries.length],
    email: `${name.split(" ")[0].toLowerCase()}@${company.toLowerCase().replace(/^(pt|cv) /, "").replace(/[^a-z]/g, "").slice(0, 12)}.co.id`,
    phone: `+62 8${11 + ((i * 7) % 47)}-${1000 + ((i * 373) % 8999)}-${1000 + ((i * 191) % 8999)}`,
    source: leadSources[i % leadSources.length], status,
    score: Math.round(20 + rnd() * 78), fit, owner, ownerSince: owner ? addDays(TODAY, -(20 + ((i * 11) % 160))) : null,
    city, area, coord: [lon + (rnd() - 0.5) * 0.5, lat + (rnd() - 0.5) * 0.4],
    value: Math.round(25 + rnd() * 380) * 1_000_000, createdAt: addDays(TODAY, -(10 + ((i * 13) % 200))),
    nextFollowUp: status === "Unqualified" || status === "Converted" ? null : addDays(TODAY, -3 + ((i * 5) % 14)),
    tags: i % 4 === 0 ? ["Enterprise"] : i % 4 === 1 ? ["SMB", "Referral"] : i % 4 === 2 ? ["SMB"] : ["Mid-market"],
  }
})

const notes: Record<ActivityType, string[]> = {
  Visit: ["On-site visit to HQ, met the operations team.", "Store visit — reviewed current POS setup.", "Visited warehouse, mapped workflow pain points."],
  Meeting: ["Discovery meeting with decision maker.", "Demo for finance and IT stakeholders.", "Proposal walkthrough with procurement."],
  Call: ["Intro call, interested in multi-branch reporting.", "Called to confirm budget timeline.", "Follow-up call — waiting for internal approval."],
  "Follow-up": ["Sent recap and next steps.", "Checked in after demo.", "Reminded about pending proposal."],
  Email: ["Sent company deck and case study.", "Shared pricing for Pro plan.", "Sent meeting invite."],
  WhatsApp: ["Quick check-in via WhatsApp.", "Shared brochure on WhatsApp.", "Confirmed meeting time via WhatsApp."],
  Note: ["Prefers communication in the morning.", "Uses a competitor contract ending in Q1.", "Budget owner is the CFO."],
}
const outcomes: Outcome[] = ["Positive", "Positive", "Neutral", "No response", "Negative"]

// Lead index → days since last touch (some intentionally stale)
const STALE: Record<number, number> = { 2: 19, 9: 26, 14: 41, 21: 16, 26: 12, 31: 33, 37: 22 }

const seedActivities: Activity[] = []
seedLeads.forEach((l, i) => {
  if (!l.owner && i !== 17) return // most unassigned leads have no activity yet
  const by = l.owner ?? "r1"
  const last = STALE[i] ?? (i * 3) % 7
  const count = l.status === "New" ? 1 : 3 + Math.floor(rnd() * 5)
  let back = last
  for (let k = 0; k < count; k++) {
    const type: ActivityType = k === 0 && l.status === "Converted" ? "Meeting" : pick(i % 3 === 0 ? ["Visit", "Meeting", "Call", "Follow-up", "Email"] : ["Call", "Follow-up", "Email", "WhatsApp", "Meeting", "Note"])
    seedActivities.push({ id: `A-${seedActivities.length + 1}`, leadId: l.id, type, at: at(back), by, outcome: type === "Note" ? "Neutral" : pick(outcomes), note: pick(notes[type]) })
    back += 2 + Math.floor(rnd() * 9)
  }
})

const seedTransfers: Transfer[] = [
  { id: "T-1", leadId: "L-1009", from: null, to: "r6", at: `${addDays(TODAY, -140)}T10:00:00`, by: "r7", reason: "Territory realignment", note: "Initial assignment after Kalimantan split." },
  { id: "T-2", leadId: "L-1002", from: "r1", to: "r2", at: `${addDays(TODAY, -64)}T14:20:00`, by: "r1", reason: "Territory realignment", note: "Bandung moved to West Java territory." },
  { id: "T-3", leadId: "L-1011", from: "r5", to: "r3", at: `${addDays(TODAY, -38)}T09:10:00`, by: "r1", reason: "Better product expertise", note: "Needs integration expertise." },
  { id: "T-4", leadId: "L-1020", from: "r3", to: "r5", at: `${addDays(TODAY, -21)}T16:45:00`, by: "r3", reason: "Workload balancing", note: "" },
  { id: "T-5", leadId: "L-1025", from: "r2", to: "r3", at: `${addDays(TODAY, -12)}T11:00:00`, by: "r1", reason: "Customer request", note: "Client prefers Surabaya-based rep." },
  { id: "T-6", leadId: "L-1004", from: "r2", to: "r4", at: `${addDays(TODAY, -90)}T08:30:00`, by: "r7", reason: "Rep left the company", note: "Previous owner Yudha left in July." },
].filter((t) => seedLeads.some((l) => l.id === t.leadId))

/* ───────────────────────── Pipeline ───────────────────────── */

export const stages = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won"] as const
export type Stage = (typeof stages)[number]
export type OpenStage = Exclude<Stage, "Closed Won">
export const openStages = stages.slice(0, 4) as OpenStage[]
export const stageProb: Record<Stage, number> = { Prospecting: 10, Qualification: 25, Proposal: 50, Negotiation: 75, "Closed Won": 100 }

export type Checkpoint = { id: string; label: string; hint: string; required: boolean }
/** Exit criteria: every required checkpoint of a stage must be done before the deal can leave it. */
export const defaultCheckpoints: Record<OpenStage, Checkpoint[]> = {
  Prospecting: [
    { id: "p1", label: "Decision maker identified", hint: "Name and role of the person who signs.", required: true },
    { id: "p2", label: "First meeting held", hint: "Visit, call, or video meeting logged.", required: true },
    { id: "p3", label: "Pain point documented", hint: "At least one business problem in the notes.", required: true },
    { id: "p4", label: "Company profile complete", hint: "Industry, size, and branches filled in.", required: false },
  ],
  Qualification: [
    { id: "q1", label: "Budget confirmed", hint: "Client shared a budget range.", required: true },
    { id: "q2", label: "Authority confirmed", hint: "Decision maker is engaged in the process.", required: true },
    { id: "q3", label: "Need validated", hint: "Requirements match our product.", required: true },
    { id: "q4", label: "Timeline agreed", hint: "Target go-live date is known.", required: true },
    { id: "q5", label: "Competitors identified", hint: "Who else they are evaluating.", required: false },
  ],
  Proposal: [
    { id: "o1", label: "Demo delivered", hint: "Product demo to key stakeholders.", required: false },
    { id: "o2", label: "Quote sent", hint: "Quote created and sent from Quotes.", required: true },
    { id: "o3", label: "Pricing approved internally", hint: "Discounts within policy or approved.", required: true },
    { id: "o4", label: "Proposal reviewed with client", hint: "Walkthrough meeting held.", required: true },
  ],
  Negotiation: [
    { id: "n1", label: "Final terms agreed", hint: "Scope, price and term agreed in writing.", required: true },
    { id: "n2", label: "Payment term selected", hint: "From the approved payment terms.", required: true },
    { id: "n3", label: "Legal review completed", hint: "Only for contracts above Rp 250M.", required: false },
    { id: "n4", label: "Signed contract / PO received", hint: "Upload the signed document.", required: true },
  ],
}

export const lostReasons = ["Price too high", "Chose a competitor", "No budget", "Bad timing", "Unresponsive", "Not a fit"]

export type Override = { from: Stage; to: Stage; by: string; reason: string; at: string; skipped: string[] }
export type Deal = {
  id: string; title: string; company: string; leadId: string | null; owner: string; value: number; stage: Stage | "Closed Lost"
  closeDate: string; createdAt: string; stageSince: string; checks: string[]; nextStep: string; lostReason?: string; overrides: Override[]
}

const dealTitles = ["Annual license", "Onboarding package", "Distribution contract", "Premium renewal", "Branch rollout", "Reseller package", "Enterprise upgrade", "3-month pilot", "Multi-user subscription", "POS hardware bundle", "Integration project"]
const nextSteps = ["Send proposal", "Schedule demo", "Follow-up call", "Review contract", "Meeting with directors", "Negotiate pricing", "Collect signed PO"]

const stageAt = (i: number): Stage => (["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Qualification", "Proposal", "Prospecting", "Negotiation", "Proposal"] as Stage[])[i % 10]

function checksFor(stage: Stage, r: () => number) {
  const idx = stages.indexOf(stage)
  const done: string[] = []
  openStages.forEach((s, k) => {
    defaultCheckpoints[s].forEach((c) => {
      if (k < idx) { if (c.required || r() > 0.4) done.push(c.id) }
      else if (k === idx && r() > 0.45) done.push(c.id)
    })
  })
  return done
}

const converted = seedLeads.filter((l) => l.owner && (l.status === "Converted" || l.status === "Qualified"))
const seedDeals: Deal[] = converted.map((l, i) => {
  const stage = stageAt(i)
  return {
    id: `D-${2001 + i}`, title: dealTitles[i % dealTitles.length], company: l.company, leadId: l.id, owner: l.owner!,
    value: Math.round(l.value * (0.8 + rnd() * 0.7) / 1e6) * 1e6, stage,
    closeDate: addDays(TODAY, stage === "Closed Won" ? -((i * 3) % 20) : 5 + ((i * 9) % 70)),
    createdAt: addDays(TODAY, -(25 + ((i * 7) % 90))), stageSince: addDays(TODAY, -((i * 4) % 30)),
    checks: checksFor(stage, rnd), nextStep: stage === "Closed Won" ? "Hand over to onboarding" : nextSteps[i % nextSteps.length], overrides: [],
  }
})
seedDeals.push(
  { id: `D-${2001 + seedDeals.length}`, title: "Premium renewal", company: "Harmoni Hotel", leadId: null, owner: "r5", value: 148_000_000, stage: "Closed Lost", closeDate: addDays(TODAY, -9), createdAt: addDays(TODAY, -70), stageSince: addDays(TODAY, -9), checks: checksFor("Proposal", rnd), nextStep: "", lostReason: "Chose a competitor", overrides: [] },
)
// One deal that was force-moved by a manager, to show the audit trail
if (seedDeals[3]) seedDeals[3].overrides.push({ from: "Proposal", to: "Negotiation", by: "r1", reason: "Client signed LOI; formal proposal review to follow next week.", at: `${addDays(TODAY, -6)}T15:10:00`, skipped: ["o4"] })

// Keep the timeline coherent: a lead is created before any activity, ownership change or deal that references it.
seedLeads.forEach((l) => {
  const dates = [
    ...seedActivities.filter((a) => a.leadId === l.id).map((a) => a.at.slice(0, 10)),
    ...seedTransfers.filter((t) => t.leadId === l.id).map((t) => t.at.slice(0, 10)),
    ...seedDeals.filter((d) => d.leadId === l.id).map((d) => d.createdAt),
  ].sort()
  if (dates[0] && dates[0] <= l.createdAt) l.createdAt = addDays(dates[0], -3)
  const lastTransfer = seedTransfers.filter((t) => t.leadId === l.id && t.to === l.owner).map((t) => t.at.slice(0, 10)).sort().pop()
  if (lastTransfer) l.ownerSince = lastTransfer
  if (l.ownerSince && l.ownerSince < l.createdAt) l.ownerSince = l.createdAt
})

/* ───────────────────────── Store ───────────────────────── */

export type SalesState = {
  leads: Lead[]; activities: Activity[]; transfers: Transfer[]; deals: Deal[]
  checkpoints: Record<OpenStage, Checkpoint[]>; quality: QualityRules
}
export const initialSales: SalesState = {
  leads: seedLeads, activities: seedActivities, transfers: seedTransfers, deals: seedDeals,
  checkpoints: defaultCheckpoints, quality: defaultQualityRules,
}

/* ───────────────────────── Derived helpers ───────────────────────── */

export const activitiesOf = (all: Activity[], leadId: string) => all.filter((a) => a.leadId === leadId).sort((a, b) => b.at.localeCompare(a.at))

/** Latest activity of each kind — powers "last visit / last follow-up / last meeting". */
export function lastTouches(all: Activity[], leadId: string) {
  const list = activitiesOf(all, leadId)
  const latest = (types: ActivityType[]) => list.find((a) => types.includes(a.type)) ?? null
  return {
    any: list.find((a) => a.type !== "Note") ?? null,
    visit: latest(["Visit"]),
    meeting: latest(["Meeting"]),
    followUp: latest(["Follow-up", "WhatsApp", "Email"]),
    call: latest(["Call"]),
    count: list.length,
  }
}

/** Required checkpoints still open for a stage (and any stage before it). */
export function missingChecks(deal: Pick<Deal, "checks">, from: Stage, to: Stage, cps: Record<OpenStage, Checkpoint[]>) {
  const a = stages.indexOf(from), b = stages.indexOf(to)
  if (b <= a || a < 0) return [] // moving backwards or sideways is always allowed
  const missing: (Checkpoint & { stage: OpenStage })[] = []
  for (let k = a; k < b; k++) {
    const s = stages[k] as OpenStage
    cps[s].filter((c) => c.required && !deal.checks.includes(c.id)).forEach((c) => missing.push({ ...c, stage: s }))
  }
  return missing
}
