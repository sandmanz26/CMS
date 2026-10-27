import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRightLeft, Download, List, Map as MapIcon, Plus, Search, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState, Field, FormError, GradeBadge, PageHeader, RepCell, SimpleSelect, StatusBadge } from "@/components/common/bits"
import { ReassignDialog } from "@/components/sales/ReassignDialog"
import { activityIcon } from "@/components/sales/LogActivityDialog"
import { MapLegend, TerritoryMap } from "@/components/sales/TerritoryMap"
import { addLead, useApp } from "@/data/store"
import { isStale } from "@/data/alerts"
import { coveringRep, gradeMeta, gradeOf, grades, industries, lastTouches, leadSources, leadStatuses, repById, sellers, type Fit, type Grade, type Lead } from "@/data/sales"
import { areaById, areaOfCity, areas, cityCoords } from "@/data/geo"
import { TODAY, clamp, daysAgo, fmtDate, idr, plural, relDays } from "@/lib/format"
import { cn } from "@/lib/utils"

type Segment = "all" | "unassigned" | "stale" | "attention"

export default function Leads() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { leads, activities, quality } = useApp()

  const segment = (params.get("view") as Segment) || "all"
  const [q, setQ] = useState("")
  const [owner, setOwner] = useState(params.get("owner") ?? "all")
  const [area, setArea] = useState(params.get("area") ?? "all")
  const [status, setStatus] = useState("all")
  const [grade, setGrade] = useState<Grade | "all">("all")
  const [mode, setMode] = useState<"table" | "map">("table")
  const [sel, setSel] = useState<string[]>([])
  const [reassign, setReassign] = useState<string[] | null>(null)
  const [adding, setAdding] = useState(false)

  const setSegment = (v: Segment) => { const p = new URLSearchParams(params); if (v === "all") p.delete("view"); else p.set("view", v); setParams(p, { replace: true }) }

  const rows = useMemo(() => leads.map((l) => {
    const touch = lastTouches(activities, l.id)
    return { ...l, grade: gradeOf(l.score, l.fit, quality), touch, stale: isStale(l, activities, quality), ownerInactive: !!l.owner && repById(l.owner)?.status !== "Active" }
  }), [leads, activities, quality])

  const base = rows.filter((l) =>
    (segment === "all" || (segment === "unassigned" && !l.owner) || (segment === "stale" && l.stale) || (segment === "attention" && (l.stale || !l.owner || l.ownerInactive))) &&
    (owner === "all" || (owner === "none" ? !l.owner : l.owner === owner)) &&
    (area === "all" || l.area === area) && (status === "all" || l.status === status) &&
    (!q.trim() || `${l.name} ${l.company} ${l.email} ${l.city}`.toLowerCase().includes(q.trim().toLowerCase())))
  const filtered = base.filter((l) => grade === "all" || l.grade === grade)

  // Filters changed → clear the selection so bulk actions never hit hidden rows
  useEffect(() => setSel([]), [segment, q, owner, area, status, grade])

  const counts = { all: rows.length, unassigned: rows.filter((l) => !l.owner).length, stale: rows.filter((l) => l.stale).length, attention: rows.filter((l) => l.stale || !l.owner || l.ownerInactive).length }
  const allChecked = filtered.length > 0 && filtered.every((l) => sel.includes(l.id))
  const anyFilter = q || owner !== "all" || area !== "all" || status !== "all" || grade !== "all" || segment !== "all"
  const reset = () => { setQ(""); setOwner("all"); setArea("all"); setStatus("all"); setGrade("all"); setSegment("all") }

  return (
    <>
      <PageHeader title="Leads" desc="Who owns each lead, how good it is, where it is, and when it was last touched.">
        <Button variant="outline" onClick={() => toast.info(`Exported ${plural(filtered.length, "lead")} (mock)`)}><Download />Export</Button>
        <Button onClick={() => setAdding(true)}><Plus />Add lead</Button>
      </PageHeader>

      {/* Quality distribution — doubles as a filter */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {grades.map((g) => {
          const n = base.filter((l) => l.grade === g).length
          const active = grade === g
          return (
            <button key={g} onClick={() => setGrade(active ? "all" : g)} aria-pressed={active}
              className={cn("rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40", active && "border-primary ring-2 ring-primary/15")}>
              <div className="flex items-center justify-between"><GradeBadge grade={g} /><span className="text-xs text-muted-foreground">{base.length ? Math.round((n / base.length) * 100) : 0}%</span></div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{n}</div>
              <div className="truncate text-xs text-muted-foreground">{gradeMeta[g].desc}</div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
          <TabsList>
            <TabsTrigger value="all">All <span className="text-muted-foreground">{counts.all}</span></TabsTrigger>
            <TabsTrigger value="attention">Needs attention <span className="text-muted-foreground">{counts.attention}</span></TabsTrigger>
            <TabsTrigger value="stale">Past SLA <span className="text-muted-foreground">{counts.stale}</span></TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned <span className="text-muted-foreground">{counts.unassigned}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="inline-flex rounded-lg border bg-card p-0.5" role="group" aria-label="View">
          {([["table", List, "Table"], ["map", MapIcon, "Map"]] as const).map(([m, I, l]) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}><I className="size-3.5" />{l}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, city…" className="w-full pl-8" /></div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <SimpleSelect ariaLabel="Owner" className="w-full min-w-0 sm:w-44" value={owner} onChange={setOwner} options={[{ value: "all", label: "All owners" }, { value: "none", label: "Unassigned" }, ...sellers.map((r) => ({ value: r.id, label: r.status === "Active" ? r.name : `${r.name} (${r.status.toLowerCase()})` }))]} />
          <SimpleSelect ariaLabel="Area" className="w-full min-w-0 sm:w-44" value={area} onChange={setArea} options={[{ value: "all", label: "All areas" }, ...areas.map((a) => ({ value: a.id, label: a.name }))]} />
          <SimpleSelect ariaLabel="Status" className="w-full min-w-0 sm:w-36" value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, ...leadStatuses.map((s) => ({ value: s, label: s }))]} />
        </div>
        {anyFilter && <Button variant="ghost" size="sm" onClick={reset}><X />Clear filters</Button>}
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">{sel.length} selected</span>
          <Button size="sm" onClick={() => setReassign(sel)}><ArrowRightLeft />Reassign</Button>
          <Button size="sm" variant="outline" onClick={() => toast.info(`Exported ${plural(sel.length, "lead")} (mock)`)}>Export selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSel([])}>Clear</Button>
        </div>
      )}

      {mode === "table" ? (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={(c) => setSel(c ? filtered.map((l) => l.id) : [])} aria-label="Select all" /></TableHead>
                <TableHead>Lead</TableHead><TableHead>Quality</TableHead><TableHead>Status</TableHead><TableHead>Owner</TableHead>
                <TableHead>Area</TableHead><TableHead>Last activity</TableHead><TableHead>Next follow-up</TableHead><TableHead className="text-right">Est. value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const last = l.touch.any
                const LI = last ? activityIcon[last.type] : null
                const nextDays = daysAgo(l.nextFollowUp)
                return (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={sel.includes(l.id)} onCheckedChange={(c) => setSel(c ? [...sel, l.id] : sel.filter((x) => x !== l.id))} aria-label={`Select ${l.name}`} />
                    </TableCell>
                    <TableCell className="max-w-56"><div className="truncate font-medium">{l.name}</div><div className="truncate text-xs text-muted-foreground">{l.title} · {l.company}</div></TableCell>
                    <TableCell><GradeBadge grade={l.grade} /></TableCell>
                    <TableCell><StatusBadge value={l.status} /></TableCell>
                    <TableCell onClick={(e) => { if (!l.owner) e.stopPropagation() }}>
                      {l.owner ? (
                        <RepCell id={l.owner} sub={l.ownerInactive ? <span className="text-warning">{repById(l.owner)?.status}</span> : l.ownerSince ? `since ${fmtDate(l.ownerSince)}` : undefined} />
                      ) : (
                        <Button size="xs" variant="outline" onClick={() => setReassign([l.id])}><UserPlus />Assign</Button>
                      )}
                    </TableCell>
                    <TableCell><div className="text-sm">{areaById(l.area)?.short}</div><div className="text-xs text-muted-foreground">{l.city}</div></TableCell>
                    <TableCell>
                      {last && LI ? (
                        <div className={cn("flex items-center gap-1.5 text-sm", l.stale && "text-danger")}>
                          <LI className="size-3.5 shrink-0" /><span>{last.type}</span><span className={cn("text-xs", l.stale ? "font-medium" : "text-muted-foreground")}>{relDays(last.at)}</span>
                        </div>
                      ) : <span className="text-sm text-muted-foreground">No activity</span>}
                    </TableCell>
                    <TableCell className={cn("text-sm", nextDays !== null && nextDays > 0 ? "font-medium text-danger" : "text-muted-foreground")}>
                      {l.nextFollowUp ? (nextDays !== null && nextDays > 0 ? `Overdue ${nextDays}d` : relDays(l.nextFollowUp)) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{idr(l.value)}</TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9}>
                  <EmptyState title={rows.length === 0 ? "No leads yet" : "No leads match"} desc={rows.length === 0 ? "Add your first lead or import from Data & Access." : "Try another keyword or clear the filters."}
                    action={anyFilter && <Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>} />
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-3">
            <TerritoryMap leads={filtered} quality={quality} selected={area === "all" ? null : area} onSelect={(a) => setArea(a ?? "all")} onLead={(id) => navigate(`/leads/${id}`)} />
            <MapLegend />
            <p className="text-xs text-muted-foreground">Click an area to filter the list; click a dot to open the lead. Showing {plural(filtered.length, "lead")}.</p>
          </CardContent>
        </Card>
      )}
      {mode === "table" && <p className="text-xs text-muted-foreground">Showing {filtered.length} of {plural(rows.length, "lead")}. “Past SLA” = no visit, call or follow-up within {quality.sla.A}/{quality.sla.B}/{quality.sla.C}/{quality.sla.D} days for grade A/B/C/D.</p>}

      <ReassignDialog leadIds={reassign ?? []} open={!!reassign} onOpenChange={(o) => !o && setReassign(null)} onDone={() => setSel([])} />
      <AddLeadDialog open={adding} onOpenChange={setAdding} existing={leads} onCreated={(id) => navigate(`/leads/${id}`)} />
    </>
  )
}

function AddLeadDialog({ open, onOpenChange, existing, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; existing: Lead[]; onCreated: (id: string) => void }) {
  const cities = Object.keys(cityCoords).sort()
  const [city, setCity] = useState("Jakarta")
  const [source, setSource] = useState("Website")
  const [industry, setIndustry] = useState("Retail")
  const [fit, setFit] = useState<Fit>("Partial")
  const [owner, setOwner] = useState("auto")
  const [error, setError] = useState("")
  useEffect(() => { if (open) { setCity("Jakarta"); setSource("Website"); setIndustry("Retail"); setFit("Partial"); setOwner("auto"); setError("") } }, [open])

  const area = areaOfCity(city)
  const suggested = coveringRep(area.id)
  const resolvedOwner = owner === "auto" ? (suggested?.status === "Active" ? suggested.id : null) : owner === "none" ? null : owner

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get("name") ?? "").trim(), company = String(f.get("company") ?? "").trim(), email = String(f.get("email") ?? "").trim().toLowerCase()
    if (!name || !company) return setError("Name and company can't be empty or spaces only.")
    const dup = existing.find((x) => x.email.toLowerCase() === email)
    if (dup) return setError(`This email already belongs to ${dup.name} (${dup.id}).`)
    const [lon, lat] = cityCoords[city]
    const id = addLead({
      name, company, email, title: String(f.get("title") ?? "").trim() || "Contact", industry, phone: String(f.get("phone") ?? "").trim() || "-", source,
      status: "New", score: 40, fit, owner: resolvedOwner, ownerSince: resolvedOwner ? TODAY : null, city, area: area.id, coord: [lon, lat],
      value: clamp(String(f.get("value") ?? ""), 0) * 1_000_000, createdAt: TODAY, nextFollowUp: TODAY, tags: [],
    })
    toast.success(`Lead ${name} created`, { description: resolvedOwner ? `Assigned to ${repById(resolvedOwner)?.name}` : "Left unassigned" })
    onOpenChange(false); onCreated(id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>New lead</DialogTitle><DialogDescription>The owner is suggested from the territory of the city.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name"><Input name="name" required maxLength={80} autoComplete="off" onChange={() => setError("")} /></Field>
            <Field label="Job title"><Input name="title" maxLength={60} placeholder="e.g. Operations Manager" /></Field>
            <Field label="Company"><Input name="company" required maxLength={100} /></Field>
            <Field label="Industry"><SimpleSelect className="w-full" value={industry} onChange={setIndustry} options={industries.map((i) => ({ value: i, label: i }))} /></Field>
            <Field label="Email"><Input name="email" type="email" required onChange={() => setError("")} /></Field>
            <Field label="Phone"><Input name="phone" type="tel" inputMode="tel" pattern="[0-9+\-\s()]{8,20}" title="8–20 digits; +, -, spaces allowed" /></Field>
            <Field label="City" hint={`Territory: ${area.name}`}><SimpleSelect className="w-full" value={city} onChange={setCity} options={cities.map((c) => ({ value: c, label: c }))} /></Field>
            <Field label="Source"><SimpleSelect className="w-full" value={source} onChange={setSource} options={leadSources.map((s) => ({ value: s, label: s }))} /></Field>
            <Field label="ICP fit" hint="How well the company matches your ideal customer."><SimpleSelect className="w-full" value={fit} onChange={(v) => setFit(v as Fit)} options={["Strong", "Partial", "Weak"].map((x) => ({ value: x, label: x }))} /></Field>
            <Field label="Est. value (Rp million)"><Input name="value" type="number" min={0} step="any" inputMode="decimal" /></Field>
          </div>
          <Field label="Owner" hint={owner === "auto" ? (suggested?.status === "Active" ? `Will be assigned to ${suggested.name} (covers ${area.short}).` : `${suggested?.name ?? "No rep"} covers ${area.short} but is ${suggested?.status.toLowerCase() ?? "missing"} — lead will stay unassigned.`) : undefined}>
            <SimpleSelect className="w-full" value={owner} onChange={setOwner} options={[{ value: "auto", label: "Auto — by territory" }, { value: "none", label: "Leave unassigned" }, ...sellers.map((r) => ({ value: r.id, label: r.name, disabled: r.status !== "Active" }))]} />
          </Field>
          <FormError>{error}</FormError>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Create lead</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
