// Sales materials (managed collateral), playbooks and competitive battlecards.
import { TODAY, addDays } from "@/lib/format"
import type { Stage } from "./sales"

export const folders = ["Pitch decks", "Brochures", "Case studies", "Price lists", "Templates", "Training", "Competitive"] as const
export type Folder = (typeof folders)[number]
export type MaterialStatus = "Draft" | "In review" | "Published" | "Archived"
export type FileFormat = "PDF" | "PPTX" | "MP4" | "DOCX" | "XLSX" | "PNG"

export type Material = {
  id: string; title: string; desc: string; folder: Folder; format: FileFormat; status: MaterialStatus
  version: number; versions: { v: number; at: string; by: string; note: string }[]
  owner: string; updated: string; expires: string | null; stages: Stage[]; industries: string[]
  required: boolean; acknowledged: string[]; views: number; downloads: number
  shares: { leadId: string; by: string; at: string }[]; size: string
}

const v = (n: number, by: string, back: number, note: string) => ({ v: n, at: addDays(TODAY, -back), by, note })

export const initialMaterials: Material[] = [
  { id: "m1", title: "Company pitch deck 2026", desc: "Main deck for first meetings: problem, solution, proof, pricing overview.", folder: "Pitch decks", format: "PPTX", status: "Published", version: 4,
    versions: [v(4, "r1", 7, "Updated customer logos and Q3 metrics"), v(3, "r1", 64, "New pricing slide"), v(2, "r8", 140, "Rebrand"), v(1, "r1", 300, "Initial")],
    owner: "r1", updated: addDays(TODAY, -7), expires: addDays(TODAY, 70), stages: ["Prospecting", "Qualification"], industries: [], required: true,
    acknowledged: ["r1", "r2", "r3", "r5", "r7"], views: 1284, downloads: 342, shares: [{ leadId: "L-1001", by: "r1", at: addDays(TODAY, -3) }, { leadId: "L-1003", by: "r3", at: addDays(TODAY, -5) }], size: "12.4 MB" },
  { id: "m2", title: "Enterprise plan brochure", desc: "Two-page overview of Enterprise features, SLA and security.", folder: "Brochures", format: "PDF", status: "Published", version: 2,
    versions: [v(2, "r1", 12, "Added SSO and audit log"), v(1, "r1", 120, "Initial")],
    owner: "r1", updated: addDays(TODAY, -12), expires: null, stages: ["Qualification", "Proposal"], industries: [], required: false,
    acknowledged: [], views: 902, downloads: 288, shares: [{ leadId: "L-1005", by: "r5", at: addDays(TODAY, -2) }], size: "3.1 MB" },
  { id: "m3", title: "Case study — Kopi Kelana", desc: "How a 40-outlet coffee chain cut reporting time by 70%.", folder: "Case studies", format: "PDF", status: "Published", version: 1,
    versions: [v(1, "r2", 23, "Initial")], owner: "r2", updated: addDays(TODAY, -23), expires: null, stages: ["Qualification", "Proposal"], industries: ["F&B", "Retail"], required: false,
    acknowledged: [], views: 611, downloads: 199, shares: [], size: "2.4 MB" },
  { id: "m4", title: "Product demo (5 min)", desc: "Recorded demo for prospects who missed the live session.", folder: "Training", format: "MP4", status: "Published", version: 3,
    versions: [v(3, "r2", 19, "New dashboard UI"), v(2, "r2", 160, "Voice-over"), v(1, "r2", 260, "Initial")], owner: "r2", updated: addDays(TODAY, -19), expires: null, stages: ["Prospecting", "Proposal"], industries: [], required: true,
    acknowledged: ["r1", "r2", "r3", "r4", "r5", "r6", "r7"], views: 1740, downloads: 410, shares: [], size: "86 MB" },
  { id: "m5", title: "Follow-up email templates", desc: "Five templates: after demo, after proposal, no response, renewal, referral.", folder: "Templates", format: "DOCX", status: "Published", version: 2,
    versions: [v(2, "r3", 10, "Added WhatsApp variants"), v(1, "r3", 90, "Initial")], owner: "r3", updated: addDays(TODAY, -10), expires: null, stages: ["Prospecting", "Qualification", "Proposal", "Negotiation"], industries: [], required: false,
    acknowledged: [], views: 540, downloads: 220, shares: [], size: "48 KB" },
  { id: "m6", title: "Standard quote template", desc: "Quote layout with terms and payment schedule.", folder: "Templates", format: "DOCX", status: "Published", version: 5,
    versions: [v(5, "r8", 63, "PPN 11% wording"), v(4, "r8", 150, "Payment terms section")], owner: "r8", updated: addDays(TODAY, -63), expires: null, stages: ["Proposal", "Negotiation"], industries: [], required: false,
    acknowledged: [], views: 478, downloads: 301, shares: [], size: "88 KB" },
  { id: "m7", title: "Price list Q4 2026", desc: "Official prices and discount bands for Q4.", folder: "Price lists", format: "XLSX", status: "In review", version: 1,
    versions: [v(1, "r8", 2, "Draft for finance review")], owner: "r8", updated: addDays(TODAY, -2), expires: "2026-12-31", stages: ["Proposal", "Negotiation"], industries: [], required: true,
    acknowledged: [], views: 14, downloads: 0, shares: [], size: "640 KB" },
  { id: "m8", title: "Price list Q3 2026", desc: "Superseded by Q4 price list.", folder: "Price lists", format: "XLSX", status: "Published", version: 2,
    versions: [v(2, "r8", 100, "Hardware prices"), v(1, "r8", 112, "Initial")], owner: "r8", updated: addDays(TODAY, -100), expires: "2026-09-30", stages: ["Proposal", "Negotiation"], industries: [], required: false,
    acknowledged: [], views: 820, downloads: 410, shares: [], size: "610 KB" },
  { id: "m9", title: "Case study — Tirta Logistik", desc: "Fleet visibility rollout across 12 depots.", folder: "Case studies", format: "PDF", status: "Draft", version: 1,
    versions: [v(1, "r3", 1, "First draft")], owner: "r3", updated: addDays(TODAY, -1), expires: null, stages: ["Qualification", "Proposal"], industries: ["Logistics"], required: false,
    acknowledged: [], views: 3, downloads: 0, shares: [], size: "2.9 MB" },
  { id: "m10", title: "Battlecard pack — POS competitors", desc: "Positioning against the three most common competitors.", folder: "Competitive", format: "PDF", status: "Published", version: 3,
    versions: [v(3, "r2", 16, "OmniRetail pricing update")], owner: "r2", updated: addDays(TODAY, -16), expires: addDays(TODAY, 5), stages: ["Qualification", "Negotiation"], industries: ["Retail"], required: true,
    acknowledged: ["r1", "r2", "r3"], views: 233, downloads: 97, shares: [], size: "1.2 MB" },
  { id: "m11", title: "Onboarding training for new reps", desc: "Week-one curriculum: product, process, tools.", folder: "Training", format: "PDF", status: "Published", version: 2,
    versions: [v(2, "r7", 40, "Added pipeline checkpoints")], owner: "r7", updated: addDays(TODAY, -40), expires: null, stages: [], industries: [], required: true,
    acknowledged: ["r1", "r2", "r3", "r5", "r7"], views: 160, downloads: 48, shares: [], size: "4.6 MB" },
  { id: "m12", title: "Deck Q1 2025 (old)", desc: "Kept for reference.", folder: "Pitch decks", format: "PPTX", status: "Archived", version: 1,
    versions: [v(1, "r1", 560, "Initial")], owner: "r1", updated: addDays(TODAY, -560), expires: null, stages: [], industries: [], required: false,
    acknowledged: [], views: 98, downloads: 3, shares: [], size: "9.8 MB" },
]

/** Published material whose expiry date has passed is treated as Expired (cannot be shared). */
export type EffectiveStatus = MaterialStatus | "Expired"
export const effectiveStatus = (m: Pick<Material, "status" | "expires">): EffectiveStatus =>
  m.status === "Published" && m.expires && m.expires < TODAY ? "Expired" : m.status

export type Playbook = { id: string; title: string; scenario: string; steps: string[]; adoption: number; owner: string }
export const playbooks: Playbook[] = [
  { id: "pb1", title: "30-minute discovery call", scenario: "New prospect", adoption: 86, owner: "r1", steps: ["Research the account and LinkedIn for 10 minutes", "Open with the agenda and confirm the time", "Uncover the top 3 pain points (SPIN)", "Confirm budget, authority, and timeline", "Close with a scheduled next step"] },
  { id: "pb2", title: "Handling price objections", scenario: "Negotiation", adoption: 71, owner: "r2", steps: ["Listen and restate the objection", "Ask what they are comparing against", "Show ROI and total cost of ownership", "Offer a phased package, not a discount", "Get manager approval for discounts above 10%"] },
  { id: "pb3", title: "90-day renewal", scenario: "Retention", adoption: 64, owner: "r3", steps: ["D-90: review usage and health score", "D-60: send a value report", "D-45: meet the decision maker", "D-30: send the renewal quote", "D-7: escalate if there is no response"] },
]
export type Battlecard = { id: string; competitor: string; strengths: string[]; weaknesses: string[]; talkTrack: string; winRate: number; updated: string }
export const battlecards: Battlecard[] = [
  { id: "bc1", competitor: "KasirPintar", strengths: ["Low entry price", "Well known among SMBs"], weaknesses: ["No open API", "Limited reporting", "Support during office hours only"], talkTrack: "Ask how often they need multi-branch reports, then show our consolidated dashboard.", winRate: 62, updated: "2026-10-05" },
  { id: "bc2", competitor: "OmniRetail Suite", strengths: ["Feature-rich", "ERP integration"], weaknesses: ["3–6 month implementation", "High license cost"], talkTrack: "Lead with time-to-value: live in 2 weeks vs 3 months, ~40% lower TCO.", winRate: 54, updated: "2026-09-22" },
  { id: "bc3", competitor: "Spreadsheets + WhatsApp", strengths: ["Free", "Already familiar"], weaknesses: ["Scattered data", "No forecasting", "Error-prone"], talkTrack: "Quantify weekly admin hours, then offer a 30-day pilot with free data migration.", winRate: 78, updated: "2026-08-30" },
]
