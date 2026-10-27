// App-wide in-memory store + business actions. Mock only — resets on page refresh.
import { createStore } from "@/lib/store"
import { TODAY, nextId } from "@/lib/format"
import { initialSales, stageProb, type Activity, type ActivityType, type Checkpoint, type Deal, type Lead, type OpenStage, type Outcome, type QualityRules, type SalesState, type Stage } from "./sales"
import { initialMaterials, type Material } from "./enablement"
import { initialTargets, type Month, type TargetMap } from "./targets"

type AppState = SalesState & { materials: Material[]; targets: TargetMap }

export const app = createStore<AppState>({ ...initialSales, materials: initialMaterials, targets: initialTargets })
export const useApp = app.use

const now = () => `${TODAY}T${new Date().toTimeString().slice(0, 8)}`

/* ── Leads ── */
export function addLead(l: Omit<Lead, "id">) {
  const id = nextId("L-", app.get().leads.map((x) => x.id))
  app.set((s) => ({ ...s, leads: [{ ...l, id }, ...s.leads] }))
  return id
}
export function updateLead(id: string, patch: Partial<Lead>) {
  app.set((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
}

/** Change owner of one or more leads. Records a transfer entry per lead, optionally moves their open deals too. */
export function reassignLeads(ids: string[], to: string, reason: string, note: string, by: string, moveDeals: boolean) {
  app.set((s) => {
    const changed = s.leads.filter((l) => ids.includes(l.id) && l.owner !== to)
    let tId = s.transfers.length
    const transfers = changed.map((l) => ({ id: `T-${++tId}`, leadId: l.id, from: l.owner, to, at: now(), by, reason, note }))
    const changedIds = changed.map((l) => l.id)
    return {
      ...s,
      leads: s.leads.map((l) => (changedIds.includes(l.id) ? { ...l, owner: to, ownerSince: TODAY } : l)),
      transfers: [...transfers, ...s.transfers],
      deals: moveDeals ? s.deals.map((d) => (d.leadId && changedIds.includes(d.leadId) && d.stage !== "Closed Won" && d.stage !== "Closed Lost" ? { ...d, owner: to } : d)) : s.deals,
    }
  })
}

export function logActivity(a: { leadId: string; type: ActivityType; at: string; by: string; outcome: Outcome; note: string; nextFollowUp: string | null }) {
  app.set((s) => {
    const id = nextId("A-", s.activities.map((x) => x.id))
    const act: Activity = { id, leadId: a.leadId, type: a.type, at: a.at, by: a.by, outcome: a.outcome, note: a.note }
    return {
      ...s,
      activities: [act, ...s.activities],
      // Logging a real touch moves a brand-new lead to Contacted
      leads: s.leads.map((l) => (l.id !== a.leadId ? l : { ...l, status: l.status === "New" && a.type !== "Note" ? "Contacted" : l.status, nextFollowUp: a.nextFollowUp ?? l.nextFollowUp })),
    }
  })
}

/* ── Deals ── */
export function addDeal(d: Omit<Deal, "id">) {
  const id = nextId("D-", app.get().deals.map((x) => x.id))
  app.set((s) => ({ ...s, deals: [{ ...d, id }, ...s.deals] }))
  return id
}
export function updateDeal(id: string, patch: Partial<Deal>) {
  app.set((s) => ({ ...s, deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
}
export function toggleCheck(id: string, cp: string) {
  app.set((s) => ({ ...s, deals: s.deals.map((d) => (d.id !== id ? d : { ...d, checks: d.checks.includes(cp) ? d.checks.filter((c) => c !== cp) : [...d.checks, cp] })) }))
}
export function moveDeal(id: string, to: Stage, override?: { by: string; reason: string; skipped: string[] }) {
  app.set((s) => ({
    ...s,
    deals: s.deals.map((d) => {
      if (d.id !== id || d.stage === to) return d
      const from = d.stage === "Closed Lost" ? "Prospecting" : d.stage
      return { ...d, stage: to, stageSince: TODAY, overrides: override ? [...d.overrides, { from, to, at: now(), ...override }] : d.overrides }
    }),
  }))
}
export const probabilityOf = (d: Pick<Deal, "stage">) => (d.stage === "Closed Lost" ? 0 : stageProb[d.stage])

/* ── Settings ── */
export const setCheckpoints = (stage: OpenStage, list: Checkpoint[]) => app.set((s) => ({ ...s, checkpoints: { ...s.checkpoints, [stage]: list } }))
export const setQuality = (q: QualityRules) => app.set((s) => ({ ...s, quality: q }))

/* ── Materials ── */
export function addMaterial(m: Omit<Material, "id">) {
  const id = nextId("m", app.get().materials.map((x) => x.id))
  app.set((s) => ({ ...s, materials: [{ ...m, id }, ...s.materials] }))
  return id
}
export function updateMaterial(id: string, patch: Partial<Material> | ((m: Material) => Partial<Material>)) {
  app.set((s) => ({ ...s, materials: s.materials.map((m) => (m.id === id ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m)) }))
}

/* ── Targets ── */
export function setTargets(repId: string, values: Partial<Record<Month, number>>) {
  app.set((s) => ({ ...s, targets: { ...s.targets, [repId]: { ...s.targets[repId], ...values } } }))
}
