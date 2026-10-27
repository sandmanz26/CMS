// Finance mock data: payment terms, invoices, installments, approvals.
import { TODAY, addDays } from "@/lib/format"
export { TODAY }

export type TermTrigger = "On PO / signing" | "On delivery" | "On go-live" | "After invoice"
export const termTriggers: TermTrigger[] = ["On PO / signing", "On delivery", "On go-live", "After invoice"]
export type TermStep = { label: string; pct: number; trigger: TermTrigger; days: number }
export type PaymentTerm = {
  id: string; code: string; name: string; desc: string; steps: TermStep[]
  defaultFor: string[]; active: boolean; usage: number; lateFee: number; needsApproval: boolean
}

export const paymentTerms: PaymentTerm[] = [
  { id: "pt1", code: "NET30", name: "Net 30", desc: "Paid in full 30 days after the invoice date.", defaultFor: ["SMB"], active: true, usage: 41, lateFee: 1, needsApproval: false,
    steps: [{ label: "Full payment", pct: 100, trigger: "After invoice", days: 30 }] },
  { id: "pt2", code: "DP30-70", name: "30% deposit · 70% balance", desc: "Deposit on PO, balance on go-live.", defaultFor: ["Mid-market"], active: true, usage: 27, lateFee: 1, needsApproval: false,
    steps: [{ label: "Deposit", pct: 30, trigger: "On PO / signing", days: 7 }, { label: "Balance", pct: 70, trigger: "On go-live", days: 14 }] },
  { id: "pt3", code: "3X", name: "3 installments", desc: "40% upfront, 30% on delivery, 30% on go-live.", defaultFor: ["Enterprise"], active: true, usage: 15, lateFee: 1.5, needsApproval: false,
    steps: [{ label: "Installment 1", pct: 40, trigger: "On PO / signing", days: 7 }, { label: "Installment 2", pct: 30, trigger: "On delivery", days: 14 }, { label: "Installment 3", pct: 30, trigger: "On go-live", days: 30 }] },
  { id: "pt4", code: "NET60", name: "Net 60 (special)", desc: "Strategic accounts only. Requires Finance approval.", defaultFor: [], active: true, usage: 4, lateFee: 2, needsApproval: true,
    steps: [{ label: "Full payment", pct: 100, trigger: "After invoice", days: 60 }] },
  { id: "pt5", code: "CBD", name: "Cash before delivery", desc: "Paid in full before goods ship.", defaultFor: [], active: false, usage: 9, lateFee: 0, needsApproval: false,
    steps: [{ label: "Full payment", pct: 100, trigger: "On PO / signing", days: 3 }] },
]
export const termById = (id: string) => paymentTerms.find((t) => t.id === id) ?? paymentTerms[0]

export type InstallmentStatus = "Paid" | "Due" | "Overdue"
export type Installment = { label: string; pct: number; amount: number; due: string; status: InstallmentStatus; paidAt?: string }
export type InvoiceStatus = "Draft" | "Sent" | "Partially paid" | "Paid" | "Overdue" | "Void"
export type Invoice = {
  id: string; quoteId: string; company: string; owner: string; issued: string; due: string
  subtotal: number; tax: number; total: number; paid: number; status: InvoiceStatus; termId: string; installments: Installment[]
}

const companies = ["Bumi Agro", "Delta Konstruksi", "Tirta Logistik", "Kopi Kelana", "Garuda Digital", "Mitra Klinik", "Samudra Foods", "Surya Energi", "Wahana Travel", "Pelita Properti", "Lentera Edu", "Rajawali Motor"]
const owners = ["r2", "r1", "r3", "r7", "r1", "r2", "r3", "r4", "r7", "r5", "r2", "r5"]
const termOf = ["pt3", "pt2", "pt2", "pt1", "pt3", "pt1", "pt2", "pt4", "pt1", "pt2", "pt1", "pt1"]
// Payment state per installment (P = paid, D = due, O = overdue)
const pattern = ["PPD", "PP", "PO", "P", "PPD", "O", "PD", "D", "D", "PD", "D", "D"]

export const invoices: Invoice[] = companies.map((company, i) => {
  const subtotal = (60 + ((i * 97) % 520)) * 1_000_000
  const tax = Math.round(subtotal * 0.11)
  const total = subtotal + tax
  const issued = addDays("2026-09-02", i * 3)
  const term = termById(termOf[i])
  const installments: Installment[] = term.steps.map((s, k) => {
    const code = pattern[i][k] ?? "D"
    const due = addDays(issued, s.days + k * 20)
    return {
      label: s.label, pct: s.pct, amount: Math.round((total * s.pct) / 100), due,
      status: code === "P" ? "Paid" : code === "O" || due < TODAY ? "Overdue" : "Due",
      paidAt: code === "P" ? addDays(due, -2) : undefined,
    }
  })
  const paid = installments.filter((x) => x.status === "Paid").reduce((s, x) => s + x.amount, 0)
  const late = installments.some((x) => x.status === "Overdue")
  const status: InvoiceStatus = i === 11 ? "Draft" : paid >= total ? "Paid" : late ? "Overdue" : paid > 0 ? "Partially paid" : "Sent"
  return {
    id: `INV-26${issued.slice(5, 7)}-${String(i + 1).padStart(3, "0")}`, quoteId: `QT-2610-${String((i % 14) + 1).padStart(3, "0")}`,
    company, owner: owners[i], issued, due: installments[installments.length - 1].due, subtotal, tax, total, paid, status, termId: term.id, installments,
  }
})

export const cashflow = [
  { m: "May", billed: 610, collected: 540 }, { m: "Jun", billed: 680, collected: 655 }, { m: "Jul", billed: 590, collected: 602 },
  { m: "Aug", billed: 742, collected: 668 }, { m: "Sep", billed: 805, collected: 731 }, { m: "Oct", billed: 698, collected: 512 },
]
export const aging = [
  { bucket: "Not yet due", value: 1_420_000_000 }, { bucket: "1–30 days", value: 386_000_000 },
  { bucket: "31–60 days", value: 212_000_000 }, { bucket: "61–90 days", value: 94_000_000 }, { bucket: "> 90 days", value: 41_000_000 },
]

export type ApprovalType = "Discount" | "Custom term" | "Manual invoice" | "Credit limit" | "Cancellation" | "Stage override"
export type ApprovalStatus = "Pending" | "Approved" | "Rejected"
export type Approval = {
  id: string; type: ApprovalType; ref: string; company: string; requester: string; amount: number
  detail: string; reason: string; date: string; status: ApprovalStatus; level: "Manager" | "Finance" | "Director"
}
export const approvals: Approval[] = [
  { id: "ap1", type: "Discount", ref: "QT-2610-009", company: "Delta Konstruksi", requester: "r1", amount: 312_000_000, detail: "15% discount (limit 10%)", reason: "Competitor is 12% cheaper; 2-year contract.", date: "2026-10-21", status: "Pending", level: "Manager" },
  { id: "ap2", type: "Custom term", ref: "INV-2609-008", company: "Surya Energi", requester: "r4", amount: 288_000_000, detail: "Net 60 (default Net 30)", reason: "State-owned company pays on a 60-day cycle.", date: "2026-10-20", status: "Pending", level: "Finance" },
  { id: "ap3", type: "Credit limit", ref: "A-3014", company: "Rajawali Motor", requester: "r5", amount: 500_000_000, detail: "Raise limit Rp 250M → Rp 500M", reason: "Opening 4 new branches in Q1 2027.", date: "2026-10-20", status: "Pending", level: "Director" },
  { id: "ap4", type: "Manual invoice", ref: "INV-2610-012", company: "Rajawali Motor", requester: "r5", amount: 166_500_000, detail: "Issue an invoice without a quote", reason: "Extra licenses mid-contract.", date: "2026-10-19", status: "Pending", level: "Finance" },
  { id: "ap5", type: "Discount", ref: "QT-2610-004", company: "Cakra Teknik", requester: "r3", amount: 97_000_000, detail: "12% discount", reason: "Bundle with hardware.", date: "2026-10-17", status: "Approved", level: "Manager" },
  { id: "ap6", type: "Cancellation", ref: "INV-2609-006", company: "Mitra Klinik", requester: "r2", amount: 74_000_000, detail: "Void and reissue", reason: "Wrong tax ID on the invoice.", date: "2026-10-15", status: "Rejected", level: "Finance" },
]
