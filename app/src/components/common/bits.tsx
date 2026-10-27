import { useState, type ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight, Info, SearchX, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"
import { gradeMeta, repById, type Grade } from "@/data/sales"
import type { Pace } from "@/data/targets"

/* ── Tones: neutral base + primary/secondary concept + semantic meaning ── */
export type Tone = "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"
export const toneSoft: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-brand-2/12 text-brand-2",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_25%)] dark:text-warning",
  danger: "bg-danger/10 text-danger",
}
export const toneDot: Record<Tone, string> = {
  neutral: "bg-muted-foreground/50", primary: "bg-primary", secondary: "bg-brand-2", success: "bg-success", warning: "bg-warning", danger: "bg-danger",
}

export function PageHeader({ title, desc, children }: { title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function StatCard({ label, value, delta, hint, icon, tone = "neutral", deltaGoodWhen = "up" }: {
  label: string; value: ReactNode; delta?: number; hint?: ReactNode; icon?: ReactNode; tone?: Tone; deltaGoodWhen?: "up" | "down"
}) {
  const up = (delta ?? 0) >= 0
  const good = deltaGoodWhen === "up" ? up : !up
  return (
    <Card size="sm">
      <CardContent className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="truncate">{label}</span>
          {icon && <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", toneSoft[tone])}>{icon}</span>}
        </div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        <div className="flex min-h-4 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-success" : "text-danger")}>
              {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(delta)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

const statusTone: Record<string, Tone> = {
  // leads
  New: "secondary", Contacted: "neutral", Qualified: "primary", Unqualified: "neutral", Converted: "success",
  // pipeline
  Prospecting: "neutral", Qualification: "secondary", Proposal: "secondary", Negotiation: "primary", "Closed Won": "success", "Closed Lost": "danger",
  // quotes
  Draft: "neutral", Sent: "secondary", Viewed: "secondary", Accepted: "success", Declined: "danger", Expired: "warning",
  // invoices
  "Partially paid": "secondary", Paid: "success", Overdue: "danger", Void: "neutral", Due: "neutral",
  // approvals
  Pending: "warning", Approved: "success", Rejected: "danger", Manager: "neutral", Finance: "neutral", Director: "neutral",
  // materials
  "In review": "warning", Published: "success", Archived: "neutral",
  // people & misc
  Active: "success", "On leave": "warning", Inactive: "neutral", "Needs review": "warning",
  High: "danger", Medium: "warning", Low: "neutral", Enterprise: "primary", "Mid-market": "secondary", SMB: "neutral",
  Positive: "success", Neutral: "neutral", "No response": "warning", Negative: "danger",
}
export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return <Badge variant="outline" className={cn("border-transparent font-medium", toneSoft[statusTone[value] ?? "neutral"], className)}>{value}</Badge>
}

const gradeTone: Record<Grade, string> = {
  A: "bg-primary text-primary-foreground",
  B: "bg-brand-2 text-brand-2-foreground",
  C: "bg-muted text-foreground ring-1 ring-border",
  D: "bg-transparent text-muted-foreground ring-1 ring-dashed ring-border",
}
/** Lead quality grade: A Hot · B Warm · C Nurture · D Cold. */
export function GradeBadge({ grade, showLabel = true, className }: { grade: Grade; showLabel?: boolean; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap", className)} />}>
        <span className={cn("grid size-5 place-items-center rounded text-[11px] font-semibold", gradeTone[grade])}>{grade}</span>
        {showLabel && <span>{gradeMeta[grade].label}</span>}
      </TooltipTrigger>
      <TooltipContent>Grade {grade} · {gradeMeta[grade].label}: {gradeMeta[grade].desc}</TooltipContent>
    </Tooltip>
  )
}

const paceTone: Record<Pace, Tone> = { Ahead: "success", "On track": "primary", "At risk": "warning", Behind: "danger", "Not started": "neutral" }
export function PaceBadge({ pace }: { pace: Pace }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", toneSoft[paceTone[pace]])}>
      <span className={cn("size-1.5 rounded-full", toneDot[paceTone[pace]])} />{pace}
    </span>
  )
}

export function RepAvatar({ id, className }: { id: string | null | undefined; className?: string }) {
  const r = repById(id)
  return (
    <Avatar className={cn("size-6 shrink-0", className)}>
      <AvatarFallback className={cn("text-[10px] font-medium", r ? "bg-secondary text-secondary-foreground ring-1 ring-border" : "border border-dashed bg-transparent text-muted-foreground")}>
        {r ? initials(r.name) : "?"}
      </AvatarFallback>
    </Avatar>
  )
}
export function RepCell({ id, sub, size = "sm" }: { id: string | null | undefined; sub?: ReactNode; size?: "sm" | "default" }) {
  const r = repById(id)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <RepAvatar id={id} className={size === "sm" ? "size-6" : "size-8"} />
      <div className="min-w-0 leading-tight">
        <div className={cn("truncate text-sm", !r && "text-muted-foreground italic")}>{r?.name ?? "Unassigned"}</div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  )
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/80" style={{ width: `${Math.max(0, Math.min(score, 100))}%` }} /></div>
      <span className="w-6 text-xs tabular-nums text-muted-foreground">{score}</span>
    </div>
  )
}

export function SimpleSelect({ value, onChange, options, placeholder, className, disabled, ariaLabel }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string; disabled?: boolean }[]; placeholder?: string; className?: string; disabled?: boolean; ariaLabel?: string
}) {
  return (
    <Select value={value || null} onValueChange={(v) => onChange((v as string) ?? "")} items={options} disabled={disabled}>
      <SelectTrigger className={cn("min-w-32", className)} aria-label={ariaLabel}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value} disabled={o.disabled}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  // <label> wraps the control so the name is read by screen readers and clicking focuses the input
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

/** Dismissible explanation of what a page/section does. */
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="relative flex gap-3 rounded-lg border bg-card p-3.5 pr-10 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="space-y-0.5"><p className="font-medium">{title}</p><div className="text-muted-foreground">{children}</div></div>
      <button onClick={() => setOpen(false)} className="absolute top-2.5 right-2.5 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Dismiss"><X className="size-3.5" /></button>
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{children}</p>
}

export const chartTip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }
export const axisProps = { fontSize: 12, tickLine: false, axisLine: false, stroke: "var(--muted-foreground)" } as const

export function SectionTitle({ title, desc, children }: { title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div><h2 className="text-base font-semibold">{title}</h2>{desc && <p className="text-sm text-muted-foreground">{desc}</p>}</div>
      {children}
    </div>
  )
}

export function EmptyState({ title = "Nothing here yet", desc, action, icon }: { title?: string; desc?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 px-4 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">{icon ?? <SearchX className="size-5" />}</span>
      <p className="font-medium">{title}</p>
      {desc && <p className="max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action}
    </div>
  )
}

/** Small key–value pair for detail panels. */
export function Meta({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="truncate text-sm">{children}</dd></div>
}
