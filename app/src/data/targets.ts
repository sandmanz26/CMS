// Revenue targets (omzet) per rep per month, plus closed revenue actuals.
import { TODAY } from "@/lib/format"

export const months = ["2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"] as const
export type Month = (typeof months)[number]
export const CURRENT_MONTH: Month = "2026-10"
export const monthLabel = (m: string) => new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(`${m}-01`))
export const monthShort = (m: string) => new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(`${m}-01`))
export const quarters: Record<string, Month[]> = { "Q3 2026": ["2026-07", "2026-08", "2026-09"], "Q4 2026": ["2026-10", "2026-11", "2026-12"] }

const M = 1_000_000
const base: Record<string, number> = { r1: 1200, r2: 900, r3: 850, r4: 600, r5: 550, r6: 500, r7: 480 }
const season = [0.95, 1, 1, 1.05, 1.1, 1.25]
export type TargetMap = Record<string, Record<Month, number>>
export const initialTargets: TargetMap = Object.fromEntries(
  Object.entries(base).map(([id, b]) => [id, Object.fromEntries(months.map((m, i) => [m, Math.round((b * season[i]) / 10) * 10 * M]))]),
) as TargetMap

// Closed-won revenue. Past months are final; October is month-to-date.
export const actuals: Record<string, Partial<Record<Month, number>>> = {
  r1: { "2026-07": 1090 * M, "2026-08": 1260 * M, "2026-09": 1185 * M, "2026-10": 860 * M },
  r2: { "2026-07": 880 * M, "2026-08": 940 * M, "2026-09": 1012 * M, "2026-10": 735 * M },
  r3: { "2026-07": 790 * M, "2026-08": 801 * M, "2026-09": 768 * M, "2026-10": 482 * M },
  r4: { "2026-07": 402 * M, "2026-08": 455 * M, "2026-09": 431 * M, "2026-10": 214 * M },
  r5: { "2026-07": 530 * M, "2026-08": 566 * M, "2026-09": 590 * M, "2026-10": 421 * M },
  r6: { "2026-07": 470 * M, "2026-08": 488 * M, "2026-09": 210 * M, "2026-10": 95 * M },
  r7: { "2026-07": 455 * M, "2026-08": 470 * M, "2026-09": 512 * M, "2026-10": 318 * M },
}

/** Share of the period that has elapsed (0–1) as of TODAY. */
export function elapsed(ms: readonly Month[]) {
  const today = new Date(TODAY)
  let total = 0, done = 0
  for (const m of ms) {
    const [y, mo] = m.split("-").map(Number)
    const days = new Date(y, mo, 0).getDate()
    total += days
    const start = new Date(y, mo - 1, 1)
    if (today >= new Date(y, mo, 1)) done += days
    else if (today >= start) done += today.getDate()
  }
  return total ? done / total : 0
}

export type Pace = "Ahead" | "On track" | "At risk" | "Behind" | "Not started"
/** Compare attainment with how much of the period has passed. */
export function paceOf(actual: number, target: number, elapsedShare: number): Pace {
  if (elapsedShare <= 0) return "Not started"
  if (target <= 0) return "On track"
  const r = actual / target / elapsedShare
  return r >= 1.05 ? "Ahead" : r >= 0.95 ? "On track" : r >= 0.8 ? "At risk" : "Behind"
}

// Daily cumulative closed revenue for the team in the current month (Rp M), used by the pace chart.
export const octDaily = [38, 71, 96, 150, 188, 210, 236, 301, 352, 388, 431, 470, 512, 560, 618, 702, 760, 815, 888, 1002, 1095].map((v, i) => ({ day: i + 1, actual: Math.round(v * 2.86) }))

export const commissionPlans = [
  { id: "cp1", name: "Standard Sales Rep", base: 3.0, accelerator: 5.0, threshold: 100, applies: "Sales Rep" },
  { id: "cp2", name: "Senior AE", base: 3.5, accelerator: 6.0, threshold: 100, applies: "Senior AE" },
  { id: "cp3", name: "Manager (team override)", base: 1.0, accelerator: 1.5, threshold: 90, applies: "Sales Manager" },
]
