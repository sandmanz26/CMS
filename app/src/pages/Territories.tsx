import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Callout, GradeBadge, PageHeader, RepCell } from "@/components/common/bits"
import { MapLegend, TerritoryMap, type MapMetric } from "@/components/sales/TerritoryMap"
import { useApp } from "@/data/store"
import { isStale } from "@/data/alerts"
import { gradeOf, grades, sellers } from "@/data/sales"
import { areas } from "@/data/geo"
import { idrShort, plural } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function Territories() {
  const navigate = useNavigate()
  const { leads, deals, activities, quality } = useApp()
  const [metric, setMetric] = useState<MapMetric>("leads")
  const [dots, setDots] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  const rows = useMemo(() => areas.map((a) => {
    const ls = leads.filter((l) => l.area === a.id)
    const reps = sellers.filter((r) => r.areas.includes(a.id))
    const active = reps.filter((r) => r.status === "Active")
    const open = deals.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost" && ls.some((l) => l.id === d.leadId))
    return {
      area: a, leads: ls, reps, active,
      byGrade: Object.fromEntries(grades.map((g) => [g, ls.filter((l) => gradeOf(l.score, l.fit, quality) === g).length])) as Record<string, number>,
      unassigned: ls.filter((l) => !l.owner).length,
      stale: ls.filter((l) => isStale(l, activities, quality)).length,
      pipeline: open.reduce((s, d) => s + d.value, 0),
      perRep: active.length ? ls.filter((l) => l.owner).length / active.length : null,
    }
  }), [leads, deals, activities, quality])

  const sel = rows.find((r) => r.area.id === selected) ?? null
  const uncovered = rows.filter((r) => r.active.length === 0)

  return (
    <>
      <PageHeader title="Territories" desc="Where your leads are, who covers each area, and where coverage is thin.">
        <div className="inline-flex rounded-lg border bg-card p-0.5" role="group" aria-label="Map metric">
          {([["leads", "Leads"], ["value", "Lead value"], ["unassigned", "Unassigned"]] as const).map(([m, l]) => (
            <button key={m} onClick={() => setMetric(m)} aria-pressed={metric === m} className={cn("rounded-md px-2.5 py-1 text-sm", metric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>
          ))}
        </div>
      </PageHeader>

      {uncovered.length > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1"><b>{uncovered.map((r) => r.area.name).join(", ")}</b> {uncovered.length === 1 ? "has" : "have"} no active rep. {plural(uncovered.reduce((s, r) => s + r.leads.length, 0), "lead")} need a temporary owner.</span>
          <Button size="sm" variant="outline" render={<Link to={`/leads?area=${uncovered[0].area.id}`} />}>Review leads</Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardContent className="space-y-3">
            <TerritoryMap leads={leads} quality={quality} metric={metric} selected={selected} onSelect={setSelected} onLead={(id) => navigate(`/leads/${id}`)} showDots={dots} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <MapLegend />
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={dots} onCheckedChange={setDots} />Show individual leads</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          {sel ? (
            <>
              <CardHeader><CardTitle>{sel.area.name}</CardTitle><CardDescription>{sel.area.cities.join(" · ")}</CardDescription></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Coverage</div>
                  {sel.reps.length === 0 && <p className="text-danger">No rep assigned to this area.</p>}
                  {sel.reps.map((r) => <RepCell key={r.id} id={r.id} sub={<span className={r.status !== "Active" ? "text-warning" : undefined}>{r.role} · {r.status}</span>} />)}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/60 p-2.5"><div className="text-xs text-muted-foreground">Leads</div><div className="font-semibold">{sel.leads.length}</div></div>
                  <div className="rounded-md bg-muted/60 p-2.5"><div className="text-xs text-muted-foreground">Unassigned</div><div className={cn("font-semibold", sel.unassigned && "text-danger")}>{sel.unassigned}</div></div>
                  <div className="rounded-md bg-muted/60 p-2.5"><div className="text-xs text-muted-foreground">Past SLA</div><div className={cn("font-semibold", sel.stale && "text-warning")}>{sel.stale}</div></div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Quality mix</div>
                  {grades.map((g) => (
                    <div key={g} className="flex items-center gap-2">
                      <GradeBadge grade={g} showLabel={false} />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${sel.leads.length ? (sel.byGrade[g] / sel.leads.length) * 100 : 0}%` }} /></div>
                      <span className="w-5 text-right text-xs tabular-nums">{sel.byGrade[g]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-3"><span className="text-muted-foreground">Open pipeline</span><span className="font-medium">{idrShort(sel.pipeline)}</span></div>
                <Button className="w-full" variant="outline" render={<Link to={`/leads?area=${sel.area.id}`} />}>Open {plural(sel.leads.length, "lead")}<ArrowRight /></Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader><CardTitle>All territories</CardTitle><CardDescription>Select an area on the map for details.</CardDescription></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[...rows].sort((a, b) => b.leads.length - a.leads.length).map((r) => (
                  <button key={r.area.id} onClick={() => setSelected(r.area.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted">
                    <span className="min-w-0 flex-1 truncate">{r.area.name}</span>
                    {r.active.length === 0 && <AlertTriangle className="size-3.5 text-warning" aria-label="No active rep" />}
                    <span className="tabular-nums text-muted-foreground">{r.leads.length}</span>
                  </button>
                ))}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <Callout title="Leads per rep">A healthy load is 4–8 open leads per active rep in an area. Above that, follow-ups start to slip past the SLA; consider splitting the territory or adding coverage.</Callout>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Area</TableHead><TableHead>Coverage</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Hot (A)</TableHead>
            <TableHead className="text-right">Unassigned</TableHead><TableHead className="text-right">Past SLA</TableHead><TableHead className="text-right">Leads / rep</TableHead><TableHead className="text-right">Open pipeline</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.area.id} className={cn("cursor-pointer", selected === r.area.id && "bg-muted/60")} onClick={() => setSelected(r.area.id)}>
                <TableCell className="font-medium">{r.area.name}</TableCell>
                <TableCell>{r.reps.length ? <div className="flex flex-col gap-1">{r.reps.map((x) => <RepCell key={x.id} id={x.id} sub={x.status !== "Active" ? <span className="text-warning">{x.status}</span> : undefined} />)}</div> : <span className="text-danger">None</span>}</TableCell>
                <TableCell className="text-right tabular-nums">{r.leads.length}</TableCell>
                <TableCell className="text-right tabular-nums">{r.byGrade.A}</TableCell>
                <TableCell className={cn("text-right tabular-nums", r.unassigned && "font-medium text-danger")}>{r.unassigned}</TableCell>
                <TableCell className={cn("text-right tabular-nums", r.stale && "text-warning")}>{r.stale}</TableCell>
                <TableCell className={cn("text-right tabular-nums", r.perRep !== null && r.perRep > 8 && "text-warning")}>{r.perRep === null ? <span className="text-danger">no active rep</span> : r.perRep.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums">{idrShort(r.pipeline)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
