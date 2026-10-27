// All helpers are safe against empty/NaN/invalid dates — they render "—" instead of crashing.

/** Fixed "today" for the mock dataset so relative dates stay stable. */
export const TODAY = "2026-10-21"

const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : null)

export const idr = (n: number) => {
  const v = num(n)
  return v === null ? "—" : `Rp ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v)}`
}

export const idrShort = (n: number) => {
  const v = num(n)
  if (v === null) return "—"
  const sign = v < 0 ? "-" : ""
  const a = Math.abs(v)
  const fmt = (x: number) => x.toFixed(1).replace(/\.0$/, "")
  if (a >= 1e12) return `${sign}Rp ${fmt(a / 1e12)}T`
  if (a >= 1e9) return `${sign}Rp ${fmt(a / 1e9)}B`
  if (a >= 1e6) return `${sign}Rp ${fmt(a / 1e6)}M`
  if (a >= 1e3) return `${sign}Rp ${Math.round(a / 1e3)}K`
  return `${sign}Rp ${Math.round(a)}`
}

export const isValidDate = (iso: string | null | undefined) => !!iso && !Number.isNaN(new Date(iso).getTime())

export const fmtDate = (iso: string | null | undefined) =>
  isValidDate(iso) ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso!)) : "—"

export const fmtDateTime = (iso: string | null | undefined) =>
  isValidDate(iso) ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso!)) : "—"

/** @deprecated use fmtDate */
export const dateID = fmtDate

const DAY = 86_400_000
/** Whole days from `iso` to TODAY (positive = in the past). */
export const daysAgo = (iso: string | null | undefined) =>
  isValidDate(iso) ? Math.floor((new Date(TODAY).getTime() - new Date(iso!.slice(0, 10)).getTime()) / DAY) : null

export const relDays = (iso: string | null | undefined) => {
  const d = daysAgo(iso)
  if (d === null) return "Never"
  if (d === 0) return "Today"
  if (d === 1) return "Yesterday"
  if (d === -1) return "Tomorrow"
  if (d < 0) return `In ${-d}d`
  if (d < 30) return `${d}d ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

export const addDays = (iso: string, d: number) => {
  const x = new Date(isValidDate(iso) ? iso : TODAY)
  x.setDate(x.getDate() + d)
  return x.toISOString().slice(0, 10)
}

export const initials = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"

export const pct = (n: number) => `${Math.round(num(n) ?? 0)}%`

/** Safe percentage: avoids divide-by-zero. */
export const ratio = (a: number, b: number) => (b > 0 && Number.isFinite(a) ? Math.round((a / b) * 100) : 0)

/** Coerce an input value into a valid range; empty string → min. */
export const clamp = (v: string | number, min: number, max = Number.MAX_SAFE_INTEGER) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min
}

/** Next id from the highest existing number — safe even after deletions. */
export const nextId = (prefix: string, ids: string[], pad = 0) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.slice(prefix.length)) || 0), 0)
  return `${prefix}${String(max + 1).padStart(pad, "0")}`
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
