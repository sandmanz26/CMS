import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, Check, CheckCircle2, Circle, FileText, GripVertical, Lock, Plus, ShieldAlert, ThumbsDown, Timer } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Callout, Field, FormError, PageHeader, RepAvatar, RepCell, SimpleSelect, StatusBadge } from "@/components/common/bits"
import { addDeal, moveDeal, probabilityOf, toggleCheck, updateDeal, useApp } from "@/data/store"
import { ME, lostReasons, missingChecks, openStages, repById, sellers, stages, type Deal, type Lead, type OpenStage, type Stage } from "@/data/sales"
import { effectiveStatus } from "@/data/enablement"
import { TODAY, clamp, daysAgo, fmtDate, fmtDateTime, idr, idrShort, isValidDate, plural } from "@/lib/format"
import { cn } from "@/lib/utils"

const STALL_DAYS = 14

export default function Pipeline() {
  const { deals, leads, checkpoints } = useApp()
  const [owner, setOwner] = useState("all")
  const [showLost, setShowLost] = useState(false)
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [pending, setPending] = useState<{ id: string; to: Stage } | null>(null)
  const [adding, setAdding] = useState(false)

  const visible = deals.filter((d) => owner === "all" || d.owner === owner)
  const open = visible.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost")
  const lost = visible.filter((d) => d.stage === "Closed Lost")
  const weighted = open.reduce((s, d) => s + (d.value * probabilityOf(d)) / 100, 0)
  const blocked = open.filter((d) => missingChecks(d, d.stage as Stage, stages[stages.indexOf(d.stage as Stage) + 1], checkpoints).length > 0).length
  const detail = deals.find((d) => d.id === detailId) ?? null

  /** Central rule: forward moves need the exit checkpoints of every stage being left. */
  const attempt = (id: string, to: Stage) => {
    const d = deals.find((x) => x.id === id)
    if (!d || d.stage === to) return
    const from = d.stage === "Closed Lost" ? "Prospecting" : d.stage
    if (d.stage === "Closed Lost") return toast.error("Reopen lost deals from the deal panel first.")
    const missing = missingChecks(d, from, to, checkpoints)
    if (missing.length) return setPending({ id, to })
    moveDeal(id, to)
    if (to === "Closed Won") toast.success(`${d.title} — ${d.company} won`, { description: idr(d.value) })
    else toast(`Moved to ${to}`, { description: stages.indexOf(to) < stages.indexOf(from) ? "Moved back — checkpoints already done are kept." : undefined })
  }

  const columns: Stage[] = [...openStages, "Closed Won"]

  return (
    <>
      <PageHeader title="Pipeline" desc={`${plural(open.length, "open deal")} · ${idrShort(open.reduce((s, d) => s + d.value, 0))} total · ${idrShort(weighted)} weighted forecast`}>
        <SimpleSelect ariaLabel="Owner" value={owner} onChange={setOwner} options={[{ value: "all", label: "All reps" }, ...sellers.map((r) => ({ value: r.id, label: r.name }))]} />
        <Button onClick={() => setAdding(true)}><Plus />New deal</Button>
      </PageHeader>

      <Callout title="Stage checkpoints">
        <span className="max-md:hidden">Drag a card to move it. </span><span className="md:hidden">Tap a card to move it. </span>
        A deal can only move <b>forward</b> once the required checkpoints of its current stage are done — they're shown on each card.
        Moving back is always allowed. Managers can override with a written reason, which is kept in the audit log.
        {blocked > 0 && <> Right now <b>{plural(blocked, "deal")}</b> {blocked === 1 ? "is" : "are"} not ready for the next stage.</>}
      </Callout>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
        {columns.map((s) => {
          const col = visible.filter((d) => d.stage === s)
          const cps = s === "Closed Won" ? [] : checkpoints[s as OpenStage]
          return (
            <section key={s} aria-label={s}
              onDragOver={(e) => { e.preventDefault(); setOver(s) }} onDragLeave={() => setOver(null)}
              onDrop={() => { if (drag) attempt(drag, s); setDrag(null); setOver(null) }}
              className={cn("flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 p-2 transition-colors", over === s && "border-primary bg-primary/5")}>
              <header className="space-y-1 px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">{s}<Badge variant="secondary">{col.length}</Badge></div>
                  <span className="text-xs text-muted-foreground tabular-nums">{idrShort(col.reduce((a, d) => a + d.value, 0))}</span>
                </div>
                {cps.length > 0 && (
                  <Popover>
                    <PopoverTrigger className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">Exit criteria · {cps.filter((c) => c.required).length} required</PopoverTrigger>
                    <PopoverContent className="w-72">
                      <p className="mb-2 text-sm font-medium">To leave {s}</p>
                      <ul className="space-y-1.5 text-sm">{cps.map((c) => <li key={c.id} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /><span>{c.label}{!c.required && <span className="text-muted-foreground"> (optional)</span>}</span></li>)}</ul>
                    </PopoverContent>
                  </Popover>
                )}
                {s === "Closed Won" && <p className="text-xs text-muted-foreground">Requires every Negotiation checkpoint</p>}
              </header>
              <div className="flex min-h-24 flex-col gap-2">
                {col.map((d) => <DealCard key={d.id} deal={d} cps={cps} dragging={drag === d.id} onOpen={() => setDetailId(d.id)} onDragStart={() => setDrag(d.id)} onDragEnd={() => { setDrag(null); setOver(null) }} />)}
                {col.length === 0 && <div className="grid h-20 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">No deals</div>}
              </div>
            </section>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <label className="flex items-center gap-2"><Switch checked={showLost} onCheckedChange={setShowLost} />Show closed lost ({lost.length})</label>
      </div>
      {showLost && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lost.length === 0 && <p className="text-sm text-muted-foreground">No lost deals.</p>}
          {lost.map((d) => (
            <button key={d.id} onClick={() => setDetailId(d.id)} className="rounded-lg border bg-card p-3 text-left text-sm hover:border-primary/40">
              <div className="flex justify-between gap-2"><span className="truncate font-medium">{d.title}</span><StatusBadge value="Closed Lost" /></div>
              <div className="text-xs text-muted-foreground">{d.company} · {idrShort(d.value)} · {d.lostReason}</div>
            </button>
          ))}
        </div>
      )}

      {detail && <DealSheet deal={detail} onClose={() => setDetailId(null)} onMove={(to) => attempt(detail.id, to)} />}
      {pending && <BlockedDialog pending={pending} onClose={() => setPending(null)} />}
      <NewDealDialog open={adding} onOpenChange={setAdding} defaultOwner={owner === "all" ? "" : owner} leads={leads} />
    </>
  )
}

function DealCard({ deal: d, cps, dragging, onOpen, onDragStart, onDragEnd }: { deal: Deal; cps: { id: string; required: boolean }[]; dragging: boolean; onOpen: () => void; onDragStart: () => void; onDragEnd: () => void }) {
  const req = cps.filter((c) => c.required)
  const done = req.filter((c) => d.checks.includes(c.id)).length
  const ready = done === req.length
  const stalled = d.stage !== "Closed Won" && (daysAgo(d.stageSince) ?? 0) > STALL_DAYS
  const overdue = d.stage !== "Closed Won" && d.closeDate < TODAY
  return (
    <article draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onOpen} onKeyDown={(e) => { if (e.key === "Enter") onOpen() }} tabIndex={0}
      aria-label={`${d.title}, ${d.company}`}
      className={cn("cursor-grab rounded-lg border bg-card p-3 text-left shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing", dragging && "opacity-40")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><div className="truncate text-sm font-medium">{d.title}</div><div className="truncate text-xs text-muted-foreground">{d.company}</div></div>
        <GripVertical className="size-4 shrink-0 text-muted-foreground/40 max-md:hidden" />
      </div>
      <div className="mt-2 text-sm font-semibold tabular-nums">{idr(d.value)}</div>
      {req.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className={cn("inline-flex items-center gap-1", ready ? "text-success" : "text-muted-foreground")}>{ready ? <CheckCircle2 className="size-3.5" /> : <Lock className="size-3.5" />}{ready ? "Ready to advance" : `${done}/${req.length} checkpoints`}</span>
            {d.overrides.length > 0 && <span className="inline-flex items-center gap-0.5 text-warning" title="Moved by manager override"><ShieldAlert className="size-3.5" />Override</span>}
          </div>
          <Progress value={req.length ? (done / req.length) * 100 : 100} className="h-1" />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn("inline-flex items-center gap-1", overdue && "text-danger")}><CalendarDays className="size-3" />{fmtDate(d.closeDate)}</span>
        {stalled ? <span className="inline-flex items-center gap-1 text-warning"><Timer className="size-3" />{daysAgo(d.stageSince)}d in stage</span> : <span>{probabilityOf(d)}%</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 border-t pt-2 text-xs"><RepAvatar id={d.owner} className="size-5" /><span className="truncate">{repById(d.owner)?.name}</span></div>
    </article>
  )
}

function BlockedDialog({ pending, onClose }: { pending: { id: string; to: Stage }; onClose: () => void }) {
  const { deals, checkpoints } = useApp()
  const d = deals.find((x) => x.id === pending.id)!
  const from = d.stage as Stage
  const missing = missingChecks(d, from, pending.to, checkpoints)
  const [mode, setMode] = useState<"complete" | "override">("complete")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const me = repById(ME)!
  const canOverride = me.role === "Sales Manager" || me.role === "Admin"

  const go = () => {
    if (mode === "complete") {
      if (missing.length) return setError("Tick every remaining checkpoint first, or use a manager override.")
      moveDeal(d.id, pending.to); toast.success(`Moved to ${pending.to}`); return onClose()
    }
    if (reason.trim().length < 15) return setError("Explain why the checkpoints are skipped (at least 15 characters). This is visible in the audit log.")
    moveDeal(d.id, pending.to, { by: ME, reason: reason.trim(), skipped: missing.map((m) => m.id) })
    toast.warning(`Moved to ${pending.to} with override`, { description: `${plural(missing.length, "checkpoint")} skipped — logged.` }); onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="size-4" />Not ready for {pending.to}</DialogTitle>
          <DialogDescription>{d.title} · {d.company} — {missing.length ? `${plural(missing.length, "required checkpoint")} still open.` : "All checkpoints done."}</DialogDescription>
        </DialogHeader>
        <div className="inline-flex w-fit rounded-lg border p-0.5 text-sm" role="tablist">
          <button role="tab" aria-selected={mode === "complete"} onClick={() => { setMode("complete"); setError("") }} className={cn("rounded-md px-3 py-1", mode === "complete" && "bg-primary text-primary-foreground")}>Complete checkpoints</button>
          <button role="tab" aria-selected={mode === "override"} disabled={!canOverride} onClick={() => { setMode("override"); setError("") }} className={cn("rounded-md px-3 py-1 disabled:opacity-50", mode === "override" && "bg-primary text-primary-foreground")}>Manager override</button>
        </div>
        {mode === "complete" ? (
          <div className="space-y-2">
            {missingChecks(d, from, pending.to, checkpoints).length === 0 && <p className="text-sm text-success">All set — you can move the deal now.</p>}
            {(missingChecks({ checks: [] }, from, pending.to, checkpoints)).map((c) => (
              <label key={c.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <Checkbox checked={d.checks.includes(c.id)} onCheckedChange={() => { toggleCheck(d.id, c.id); setError("") }} className="mt-0.5" />
                <span><span className="font-medium">{c.label}</span> <span className="text-xs text-muted-foreground">· {c.stage}</span><span className="block text-xs text-muted-foreground">{c.hint}</span></span>
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-warning/10 p-3 text-sm">Skipping: {missing.map((m) => m.label).join(", ")}</div>
            <Field label="Reason for override"><Textarea rows={3} value={reason} maxLength={500} onChange={(e) => { setReason(e.target.value); setError("") }} placeholder="e.g. Client signed an LOI; proposal review will follow next week." /></Field>
          </div>
        )}
        <FormError>{error}</FormError>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={go} disabled={mode === "complete" && missing.length > 0}>{mode === "override" ? "Override & move" : `Move to ${pending.to}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DealSheet({ deal: d, onClose, onMove }: { deal: Deal; onClose: () => void; onMove: (to: Stage) => void }) {
  const { checkpoints, materials, leads } = useApp()
  const [lostReason, setLostReason] = useState(lostReasons[0])
  const lead = leads.find((l) => l.id === d.leadId)
  const isLost = d.stage === "Closed Lost"
  const idx = isLost ? -1 : stages.indexOf(d.stage as Stage)
  const recommended = materials.filter((m) => effectiveStatus(m) === "Published" && !isLost && d.stage !== "Closed Won" && m.stages.includes(d.stage as Stage)).slice(0, 4)

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader><SheetTitle>{d.title}</SheetTitle><SheetDescription>{d.company} · {d.id}</SheetDescription></SheetHeader>
        <div className="space-y-5 overflow-y-auto px-4 pb-6 text-sm">
          {isLost ? (
            <div className="space-y-2 rounded-lg bg-danger/10 p-3"><div className="font-medium text-danger">Closed lost · {d.lostReason}</div>
              <Button size="sm" variant="outline" onClick={() => { updateDeal(d.id, { stage: "Prospecting", lostReason: undefined, stageSince: TODAY }); toast("Deal reopened in Prospecting") }}>Reopen deal</Button></div>
          ) : (
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Stage</div>
              <div className="grid grid-cols-5 gap-1">
                {stages.map((s, i) => (
                  <button key={s} onClick={() => onMove(s)} aria-current={i === idx ? "step" : undefined}
                    className={cn("truncate rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors", i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
                    {s.replace("Closed ", "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">Value</div><div className="font-semibold">{idr(d.value)}</div></div>
            <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">Weighted ({probabilityOf(d)}%)</div><div className="font-semibold">{idr((d.value * probabilityOf(d)) / 100)}</div></div>
            <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">Expected close</div><div className={cn("font-semibold", d.closeDate < TODAY && d.stage !== "Closed Won" && "text-danger")}>{fmtDate(d.closeDate)}</div></div>
            <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">Owner</div><RepCell id={d.owner} /></div>
          </div>
          {lead && <Link to={`/leads/${lead.id}`} className="block rounded-lg border p-3 hover:bg-muted/50"><span className="text-xs text-muted-foreground">Lead</span><div className="font-medium">{lead.name} · {lead.company}</div></Link>}

          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">Checkpoints</div>
            {openStages.map((s, k) => {
              const list = checkpoints[s]
              const req = list.filter((c) => c.required)
              const doneReq = req.filter((c) => d.checks.includes(c.id)).length
              const current = k === idx
              return (
                <div key={s} className={cn("rounded-lg border p-3", current && "border-primary/50 bg-primary/5", k > idx && idx >= 0 && "opacity-60")}>
                  <div className="mb-2 flex items-center justify-between"><span className="font-medium">{s}{current && <span className="ml-1.5 text-xs font-normal text-primary">current</span>}</span><span className={cn("text-xs", doneReq === req.length ? "text-success" : "text-muted-foreground")}>{doneReq}/{req.length} required</span></div>
                  <ul className="space-y-1.5">
                    {list.map((c) => (
                      <li key={c.id}>
                        <label className="flex items-start gap-2.5">
                          <Checkbox checked={d.checks.includes(c.id)} onCheckedChange={() => toggleCheck(d.id, c.id)} disabled={isLost} className="mt-0.5" />
                          <span className="leading-tight">{c.label}{!c.required && <span className="text-muted-foreground"> · optional</span>}<span className="block text-xs text-muted-foreground">{c.hint}</span></span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <Field label="Next step"><Input value={d.nextStep} maxLength={120} onChange={(e) => updateDeal(d.id, { nextStep: e.target.value })} /></Field>

          {recommended.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Recommended materials for {d.stage}</div>
              {recommended.map((m) => <Link key={m.id} to="/materials" className="flex items-center gap-2 rounded-md border px-2.5 py-2 hover:bg-muted/50"><FileText className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{m.title}</span><span className="text-xs text-muted-foreground">v{m.version}</span></Link>)}
            </div>
          )}

          {d.overrides.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Overrides</div>
              {d.overrides.map((o, i) => (
                <div key={i} className="rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs">
                  <div className="font-medium">{o.from} → {o.to} by {repById(o.by)?.name}</div>
                  <div className="text-muted-foreground">{fmtDateTime(o.at)} · skipped {plural(o.skipped.length, "checkpoint")}</div>
                  <p className="mt-1">{o.reason}</p>
                </div>
              ))}
            </div>
          )}

          {!isLost && d.stage !== "Closed Won" && (
            <>
              <Separator />
              <div className="space-y-2 rounded-lg border border-dashed p-3">
                <div className="text-xs font-medium text-muted-foreground">Mark as lost</div>
                <div className="flex gap-2">
                  <SimpleSelect className="min-w-0 flex-1" value={lostReason} onChange={setLostReason} options={lostReasons.map((v) => ({ value: v, label: v }))} />
                  <Button variant="destructive" onClick={() => { updateDeal(d.id, { stage: "Closed Lost", lostReason, stageSince: TODAY }); toast(`Marked lost: ${lostReason}`); onClose() }}><ThumbsDown />Lost</Button>
                </div>
              </div>
            </>
          )}
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Circle className="size-2.5" />Created {fmtDate(d.createdAt)} · in stage since {fmtDate(d.stageSince)}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NewDealDialog({ open, onOpenChange, defaultOwner, leads }: { open: boolean; onOpenChange: (o: boolean) => void; defaultOwner: string; leads: Lead[] }) {
  const [owner, setOwner] = useState(defaultOwner)
  const [leadId, setLeadId] = useState("none")
  const [error, setError] = useState("")
  const ownerLeads = useMemo(() => leads.filter((l) => l.owner === owner && (l.status === "Qualified" || l.status === "Contacted")), [leads, owner])

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const title = String(f.get("title") ?? "").trim(), company = String(f.get("company") ?? "").trim()
    const value = clamp(String(f.get("value") ?? ""), 0), date = String(f.get("date") ?? "")
    const lead = leads.find((l) => l.id === leadId)
    if (!owner) return setError("Choose an owner.")
    if (!title || (!company && !lead)) return setError("Deal name and company are required.")
    if (value <= 0) return setError("Deal value must be greater than 0.")
    if (date && (!isValidDate(date) || date < TODAY)) return setError("Expected close can't be in the past.")
    addDeal({ title, company: company || lead!.company, leadId: lead?.id ?? null, owner, value: value * 1e6, stage: "Prospecting", closeDate: date || "2026-12-15", createdAt: TODAY, stageSince: TODAY, checks: [], nextStep: "Identify decision maker", overrides: [] })
    toast.success("Deal added to Prospecting"); onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (o) { setOwner(defaultOwner); setLeadId("none"); setError("") } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>New deal</DialogTitle><DialogDescription>New deals start in Prospecting with no checkpoints done.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Owner"><SimpleSelect className="w-full" value={owner} placeholder="Choose a rep" onChange={(v) => { setOwner(v); setLeadId("none") }} options={sellers.map((r) => ({ value: r.id, label: r.name, disabled: r.status !== "Active" }))} /></Field>
          <Field label="Linked lead" hint={owner && !ownerLeads.length ? "This rep has no contacted or qualified leads." : undefined}><SimpleSelect className="w-full" value={leadId} onChange={setLeadId} options={[{ value: "none", label: "No lead" }, ...ownerLeads.map((l) => ({ value: l.id, label: `${l.name} · ${l.company}` }))]} /></Field>
          <Field label="Deal name"><Input name="title" required maxLength={80} /></Field>
          <Field label="Company" hint={leadId !== "none" ? "Leave empty to use the lead's company." : undefined}><Input name="company" maxLength={100} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Value (Rp million)"><Input name="value" type="number" min={0.1} step="any" inputMode="decimal" required /></Field>
            <Field label="Expected close"><Input name="date" type="date" min={TODAY} /></Field>
          </div>
          <FormError>{error}</FormError>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Create deal</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
