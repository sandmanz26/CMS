import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FormError, RepAvatar, SimpleSelect } from "@/components/common/bits"
import { reassignLeads, useApp } from "@/data/store"
import { ME, repById, repName, sellers, transferReasons } from "@/data/sales"
import { areaById } from "@/data/geo"
import { plural } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Move one or more leads to another rep. Rules:
 * - a reason is mandatory (it's kept in the ownership history)
 * - only Active reps can receive leads
 * - we suggest the rep who covers the lead's territory and has the lightest load
 */
export function ReassignDialog({ leadIds, open, onOpenChange, onDone }: { leadIds: string[]; open: boolean; onOpenChange: (o: boolean) => void; onDone?: () => void }) {
  const { leads, deals } = useApp()
  const selected = useMemo(() => leads.filter((l) => leadIds.includes(l.id)), [leads, leadIds])
  const [to, setTo] = useState("")
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [moveDeals, setMoveDeals] = useState(true)
  const [notify, setNotify] = useState(true)
  const [error, setError] = useState("")

  const load = (id: string) => leads.filter((l) => l.owner === id && l.status !== "Converted" && l.status !== "Unqualified").length
  const areasOfSel = [...new Set(selected.map((l) => l.area))]
  /** 1) active rep in the territory with the lightest load → 2) manager of the current owner → 3) lightest active rep overall */
  const suggestion = useMemo(() => {
    const eligible = sellers.filter((r) => r.status === "Active" && !selected.every((l) => l.owner === r.id))
    const byLoad = (a: { id: string }, b: { id: string }) => load(a.id) - load(b.id)
    const inArea = eligible.filter((r) => selected.some((l) => r.areas.includes(l.area))).sort(byLoad)[0]
    if (inArea) return { rep: inArea, why: `covers ${inArea.areas.map((a) => areaById(a)?.short).join(", ")}` }
    const mgrId = selected.map((l) => repById(l.owner)?.managerId).find(Boolean)
    const mgr = eligible.find((r) => r.id === mgrId)
    if (mgr) return { rep: mgr, why: `no active rep in this territory — ${mgr.name.split(" ")[0]} manages the current owner` }
    const any = [...eligible].sort(byLoad)[0]
    return any ? { rep: any, why: "no active rep in this territory — lightest workload" } : null
  }, [selected, leads]) // eslint-disable-line react-hooks/exhaustive-deps
  const suggested = suggestion?.rep ?? null

  useEffect(() => {
    if (!open) return
    setTo(""); setReason(""); setNote(""); setError(""); setMoveDeals(true); setNotify(true)
  }, [open])

  const owners = [...new Set(selected.map((l) => l.owner))]
  const openDeals = deals.filter((d) => d.leadId && leadIds.includes(d.leadId) && d.stage !== "Closed Won" && d.stage !== "Closed Lost")

  const submit = () => {
    if (!selected.length) return setError("Select at least one lead.")
    if (!to) return setError("Choose the new owner.")
    if (!reason) return setError("Choose a reason — it is kept in the ownership history.")
    const target = repById(to)
    if (!target || target.status !== "Active") return setError(`${target?.name ?? "This rep"} is not active and can't receive leads.`)
    const movable = selected.filter((l) => l.owner !== to)
    if (!movable.length) return setError(`All selected leads are already owned by ${target.name}.`)
    reassignLeads(movable.map((l) => l.id), to, reason, note.trim(), ME, moveDeals)
    toast.success(`${plural(movable.length, "lead")} reassigned to ${target.name}`, {
      description: [notify && "Both reps were notified.", movable.length < selected.length && `${selected.length - movable.length} already owned by ${target.name} — skipped.`].filter(Boolean).join(" ") || undefined,
    })
    onOpenChange(false); onDone?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reassign {selected.length === 1 ? "lead" : plural(selected.length, "lead")}</DialogTitle>
          <DialogDescription>
            {selected.length === 1 ? <>{selected[0].name} · {selected[0].company}</> : <>From {owners.map((o) => repName(o)).join(", ")}</>}
            {" · "}{areasOfSel.map((a) => areaById(a)?.short).join(", ")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {suggested && to !== suggested.id && (
            <button type="button" onClick={() => { setTo(suggested.id); setError("") }} className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-left text-sm hover:bg-muted/50">
              <Sparkles className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">Suggested: <b>{suggested.name}</b> — {suggestion?.why}; {plural(load(suggested.id), "open lead")}</span>
              <span className="text-xs font-medium text-primary">Use</span>
            </button>
          )}

          <Field label="New owner">
            <SimpleSelect className="w-full" value={to} onChange={(v) => { setTo(v); setError("") }} placeholder="Choose a rep"
              options={sellers.map((r) => ({
                value: r.id, disabled: r.status !== "Active",
                label: `${r.name} · ${r.status !== "Active" ? r.status.toLowerCase() : `${load(r.id)} open`}${r.areas.some((a) => areasOfSel.includes(a)) ? " · in territory" : ""}`,
              }))} />
          </Field>

          {to && selected.length === 1 && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-sm">
              <RepAvatar id={selected[0].owner} /><span className="truncate">{repName(selected[0].owner)}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <RepAvatar id={to} /><span className="truncate font-medium">{repName(to)}</span>
            </div>
          )}

          <Field label="Reason">
            <SimpleSelect className="w-full" value={reason} onChange={(v) => { setReason(v); setError("") }} placeholder="Why is this lead moving?" options={transferReasons.map((r) => ({ value: r, label: r }))} />
          </Field>
          <Field label="Handover note" hint="Context for the new owner: last conversation, promises made, next step.">
            <Textarea rows={3} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Waiting for budget approval from CFO, follow up on Friday." />
          </Field>

          <div className="space-y-2 text-sm">
            <label className={cn("flex items-center gap-2", !openDeals.length && "text-muted-foreground")}>
              <Checkbox checked={moveDeals && openDeals.length > 0} disabled={!openDeals.length} onCheckedChange={(c) => setMoveDeals(!!c)} />
              Also move {openDeals.length ? plural(openDeals.length, "open deal") : "open deals (none)"}
            </label>
            <label className="flex items-center gap-2"><Checkbox checked={notify} onCheckedChange={(c) => setNotify(!!c)} />Notify previous and new owner</label>
          </div>
          <FormError>{error}</FormError>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Reassign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
