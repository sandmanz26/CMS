// Supporting mock data: accounts, products, quotes, tasks, feeds, audit and permissions.
import { TODAY, addDays } from "@/lib/format"
export { reps, repById, repName, sellers, ME } from "./sales"
export type { Rep } from "./sales"

export type Account = { id: string; name: string; industry: string; city: string; tier: "Enterprise" | "Mid-market" | "SMB"; owner: string; contacts: number; revenue: number; health: number; since: string }
const accNames = ["PT Maju Bersama", "CV Sinar Jaya", "Nusantara Retail", "Kopi Kelana", "Tirta Logistik", "Garuda Digital", "Bumi Agro", "Lentera Edu", "Samudra Foods", "Cakra Teknik", "Mitra Klinik", "Aksara Media", "Pelita Properti", "Rajawali Motor", "Cahaya Fashion", "Harmoni Hotel", "Sentosa Furniture", "Kreasi Printing"]
const accIndustry = ["Retail", "F&B", "Logistics", "Technology", "Agriculture", "Education", "Healthcare", "Media", "Property", "Automotive"]
const accCity = ["Jakarta", "Bandung", "Surabaya", "Medan", "Denpasar", "Makassar", "Semarang", "Balikpapan", "Yogyakarta"]
const accOwner = ["r1", "r2", "r3", "r4", "r5", "r6", "r7"]
export const accounts: Account[] = accNames.map((name, i) => ({
  id: `A-${3001 + i}`, name, industry: accIndustry[i % accIndustry.length], city: accCity[i % accCity.length],
  tier: i % 6 === 0 ? "Enterprise" : i % 3 === 0 ? "Mid-market" : "SMB",
  owner: accOwner[i % 7], contacts: 1 + (i % 5), revenue: (40 + ((i * 97) % 900)) * 1_000_000,
  health: 35 + ((i * 29) % 65), since: `202${3 + (i % 4)}-0${1 + (i % 9)}-1${i % 9}`,
}))

export type Product = { id: string; sku: string; name: string; category: string; price: number; unit: string; stock: number | null; active: boolean; sold: number }
export const products: Product[] = [
  { id: "p1", sku: "SUB-STR", name: "Starter plan", category: "Subscription", price: 150_000, unit: "user/mo", stock: null, active: true, sold: 412 },
  { id: "p2", sku: "SUB-PRO", name: "Pro plan", category: "Subscription", price: 350_000, unit: "user/mo", stock: null, active: true, sold: 288 },
  { id: "p3", sku: "SUB-ENT", name: "Enterprise plan", category: "Subscription", price: 725_000, unit: "user/mo", stock: null, active: true, sold: 96 },
  { id: "p4", sku: "SVC-ONB", name: "Onboarding & training", category: "Services", price: 12_500_000, unit: "package", stock: null, active: true, sold: 74 },
  { id: "p5", sku: "SVC-INT", name: "Custom integration / API", category: "Services", price: 35_000_000, unit: "project", stock: null, active: true, sold: 21 },
  { id: "p6", sku: "HW-POS", name: "POS terminal", category: "Hardware", price: 4_800_000, unit: "unit", stock: 58, active: true, sold: 133 },
  { id: "p7", sku: "HW-SCN", name: "Wireless barcode scanner", category: "Hardware", price: 950_000, unit: "unit", stock: 14, active: true, sold: 201 },
  { id: "p8", sku: "HW-PRT", name: "Thermal printer 80mm", category: "Hardware", price: 1_750_000, unit: "unit", stock: 0, active: false, sold: 162 },
]

export type QuoteStatus = "Draft" | "Sent" | "Viewed" | "Accepted" | "Declined" | "Expired"
export type Quote = { id: string; company: string; contact: string; total: number; status: QuoteStatus; owner: string; issued: string; validUntil: string; items: number; version: number }
const qStatus: QuoteStatus[] = ["Draft", "Sent", "Viewed", "Accepted", "Declined", "Expired"]
const qContacts = ["Rizky Firmansyah", "Agus Hartono", "Budi Santoso", "Tono Wibowo", "Yoga Pratama", "Samuel Tan", "Ivan Gunawan"]
export const quotes: Quote[] = Array.from({ length: 14 }, (_, i) => ({
  id: `QT-2610-${String(i + 1).padStart(3, "0")}`, company: accNames[(i * 3) % accNames.length], contact: qContacts[i % qContacts.length],
  total: (18 + ((i * 83) % 380)) * 1_000_000, status: qStatus[(i * 5 + 1) % 6], owner: accOwner[i % 7],
  issued: `2026-10-${String(1 + i).padStart(2, "0")}`, validUntil: `2026-${i > 9 ? "11" : "10"}-${String(15 + (i % 14)).padStart(2, "0")}`,
  items: 1 + (i % 5), version: 1 + (i % 3),
}))

export type Task = { id: string; title: string; due: string; type: "Call" | "Meeting" | "Email" | "Follow-up" | "Visit"; related: string; owner: string; done: boolean; priority: "High" | "Medium" | "Low" }
export const tasks: Task[] = [
  { id: "t1", title: "Follow up quote with Garuda Digital", due: TODAY, type: "Follow-up", related: "D-2003", owner: "r1", done: false, priority: "High" },
  { id: "t2", title: "Product demo for Mitra Klinik", due: TODAY, type: "Meeting", related: "L-1011", owner: "r2", done: false, priority: "High" },
  { id: "t3", title: "Discovery call — Aksara Media", due: TODAY, type: "Call", related: "L-1012", owner: "r3", done: true, priority: "Medium" },
  { id: "t4", title: "Send revised contract to Tirta Logistik", due: addDays(TODAY, 1), type: "Email", related: "D-2005", owner: "r1", done: false, priority: "High" },
  { id: "t5", title: "Site visit to Surya Energi", due: addDays(TODAY, 2), type: "Visit", related: "L-1022", owner: "r4", done: false, priority: "Medium" },
  { id: "t6", title: "Update pricing on QT-2610-004", due: addDays(TODAY, 2), type: "Email", related: "QT-2610-004", owner: "r5", done: false, priority: "Low" },
  { id: "t7", title: "Renewal call with Kopi Kelana", due: addDays(TODAY, 3), type: "Call", related: "A-3004", owner: "r7", done: false, priority: "Medium" },
  { id: "t8", title: "Send case study to Lentera Edu", due: addDays(TODAY, -1), type: "Email", related: "L-1008", owner: "r2", done: false, priority: "Low" },
]

export type FeedItem = { id: string; who: string; action: string; target: string; time: string }
export const activityFeed: FeedItem[] = [
  { id: "a1", who: "r2", action: "won a deal", target: "Enterprise upgrade — Bumi Agro", time: "12 min ago" },
  { id: "a2", who: "r1", action: "sent a quote", target: "QT-2610-009 · Delta Konstruksi", time: "48 min ago" },
  { id: "a3", who: "r8", action: "reassigned 3 leads", target: "Kalimantan → Gita Anggraini (rep on leave)", time: "1 h ago" },
  { id: "a4", who: "r3", action: "moved a deal to Negotiation", target: "Distribution contract — Samudra Foods", time: "2 h ago" },
  { id: "a5", who: "r4", action: "logged a visit", target: "Surya Energi — needs SAP integration", time: "3 h ago" },
  { id: "a6", who: "r7", action: "published material", target: "Onboarding training for new reps", time: "5 h ago" },
]

export const monthly = [
  { m: "May", target: 5100, actual: 4880 }, { m: "Jun", target: 5300, actual: 5610 }, { m: "Jul", target: 4790, actual: 4617 },
  { m: "Aug", target: 5080, actual: 4980 }, { m: "Sep", target: 5080, actual: 4708 }, { m: "Oct", target: 5330, actual: 3125 },
]
export const sourcePerf = [
  { source: "Website", leads: 142, won: 21 }, { source: "Referral", leads: 64, won: 22 }, { source: "LinkedIn", leads: 88, won: 11 },
  { source: "Event", leads: 51, won: 9 }, { source: "Google Ads", leads: 120, won: 10 }, { source: "Meta Ads", leads: 97, won: 6 },
]

export const auditLog = [
  { id: "l1", time: "2026-10-21 09:14", who: "r8", action: "Changed role", target: "Dimas Wijaya → Sales Rep", ip: "103.28.12.4" },
  { id: "l2", time: "2026-10-21 08:52", who: "r1", action: "Approved 15% discount", target: "QT-2610-009", ip: "36.72.201.9" },
  { id: "l3", time: "2026-10-20 17:30", who: "r8", action: "Edited pipeline checkpoints", target: "Negotiation → added “Signed contract / PO received”", ip: "103.28.12.4" },
  { id: "l4", time: "2026-10-20 16:05", who: "r1", action: "Stage override", target: "D-2004 Proposal → Negotiation (1 checkpoint skipped)", ip: "36.72.201.9" },
  { id: "l5", time: "2026-10-20 15:02", who: "r2", action: "Exported leads", target: "42 rows (CSV)", ip: "114.10.5.77" },
  { id: "l6", time: "2026-10-19 11:45", who: "r8", action: "Published material", target: "Enterprise plan brochure v2", ip: "103.28.12.4" },
]

export const integrations = [
  { id: "i1", name: "WhatsApp Business", desc: "Send messages and templates from a lead.", on: true },
  { id: "i2", name: "Google Calendar", desc: "Sync meetings, visits and follow-ups.", on: true },
  { id: "i3", name: "Gmail / Outlook", desc: "Track sent and opened emails.", on: false },
  { id: "i4", name: "Accurate / Jurnal", desc: "Create invoices from accepted quotes.", on: false },
  { id: "i5", name: "Slack", desc: "Notify on won deals and hot leads.", on: true },
]

export const permissionModules = ["Dashboard", "Leads", "Pipeline", "Territories", "Accounts", "Quotes", "Revenue targets", "Invoices & terms", "Approvals", "Materials", "Team", "Data & access", "Settings"] as const
export const roles = ["Admin", "Sales Manager", "Senior AE", "Sales Rep"] as const
// O = own records, T = team, A = all, - = no access
export const permissionMatrix: Record<(typeof roles)[number], string[]> = {
  Admin: ["A", "A", "A", "A", "A", "A", "A", "A", "A", "A", "A", "A", "A"],
  "Sales Manager": ["T", "T", "T", "T", "T", "T", "T", "T", "T", "A", "T", "-", "-"],
  "Senior AE": ["O", "O", "O", "O", "O", "O", "O", "O", "-", "A", "O", "-", "-"],
  "Sales Rep": ["O", "O", "O", "O", "O", "O", "O", "-", "-", "A", "-", "-", "-"],
}
