import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip as RT, XAxis, YAxis } from "recharts"
import { Lock, Pencil, Target, TrendingUp, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Callout, FormError, PaceBadge, PageHeader, RepCell, SimpleSelect, StatCard, axisProps, chartTip } from "@/components/common/bits"
import { probabilityOf, setTargets, useApp } from "@/data/store"
import { repById, sellers } from "@/data/sales"
import { CURRENT_MONTH, actuals, commissionPlans, elapsed, monthLabel, monthShort, months, octDaily, paceOf, quarters, type Month } from "@/data/targets"
import { clamp, idr, idrShort, ratio } from "@/lib/format"
import { cn } from "@/lib/utils"

const periods: { id: string; label: string; months: Month[] }[] = [
  { id: CURRENT_MONTH, label: monthLabel(CURRENT_MONTH), months: [CURRENT_MONTH] },
  { id: "Q4 2026", label: "Q4 2026", months: quarters["Q4 2026"] },
  { id: "Q3 2026", label: "Q3 2026", months: quarters["Q3 2026"] },
  { id: "H2 2026", label: "H2 2026", months: [...months] },
]
const M = 1_000_000

export default function Targets() {
  const { targets, deals } = useApp()
  const [periodId, setPeriodId] = useState(CURRENT_MONTH as string)
  const [editing, setEditing] = useState<string | null>(null)
  const period = periods.find((p) => p.id === periodId)!
  const share = elapsed(period.months)

  const rows = useMemo(() => sellers.map((r) => {
    const target = period.months.reduce((s, m) => s + (targets[r.id]?.[m] ?? 0), 0)
    const closed = period.months.reduce((s, m) => s + (actuals[r.id]?.[m] ?? 0), 0)
    const weighted = deals.filter((d) => d.owner === r.id && d.stage !== "Closed Won" && d.stage !== "Closed Lost" && period.months.some((m) => d.closeDate.startsWith(m)))
      .reduce((s, d) => s + (d.value * probabilityOf(d)) / 100, 0)
    const projected = share >= 1 ? closed : closed + weighted
    return { rep: r, target, closed, weighted, projected, gap: Math.max(target - projected, 0), att: ratio(closed, target), pace: paceOf(closed, target, share) }
  }), [targets, deals, period, share])

  const team = rows.reduce((a, r) => ({ target: a.target + r.target, closed: a.closed + r.closed, projected: a.projected + r.projected, weighted: a.weighted + r.weighted }), { target: 0, closed: 0, projected: 0, weighted: 0 })
  const teamPace = paceOf(team.closed, team.target, share)
  const behind = rows.filter((r) => r.pace === "Behind" || r.pace === "At risk")

  // Chart data
  const monthChart = useMemo(() => {
    const target = rows.reduce((s, r) => s + r.target, 0) / M
    const days = 31
    const pts = Array.from({ length: days }, (_, i) => {
      const day = i + 1
      const actual = octDaily.find((x) => x.day === day)?.actual
      return { day, target: Math.round((target * day) / days), actual, projected: day >= 21 ? Math.round((octDaily[20].actual + ((team.projected / M - octDaily[20].actual) * (day - 21)) / (days - 21))) : undefined }
    })
    return pts
  }, [rows, team.projected])
  const quarterChart = period.months.map((m) => ({
    m: monthShort(m),
    Target: Math.round(sellers.reduce((s, r) => s + (targets[r.id]?.[m] ?? 0), 0) / M),
    Closed: Math.round(sellers.reduce((s, r) => s + (actuals[r.id]?.[m] ?? 0), 0) / M),
  }))

  return (
    <>
      <PageHeader title="Revenue Targets" desc="Each rep's revenue (omzet) target, how much is closed, and whether they are on pace.">
        <SimpleSelect ariaLabel="Period" value={periodId} onChange={setPeriodId} options={periods.map((p) => ({ value: p.id, label: p.label }))} />
      </PageHeader>

      <Tabs defaultValue="targets">
        <TabsList><TabsTrigger value="targets">Targets & pace</TabsTrigger><TabsTrigger value="commission">Commission</TabsTrigger></TabsList>

        <TabsContent value="targets" className="mt-4 space-y-4">
          <Callout title="How pace works">
            Pace compares attainment with time elapsed. {period.label} is <b>{Math.round(share * 100)}%</b> through, so a rep at {Math.round(share * 100)}% of target is on track.
            <b> Projected</b> = closed revenue + weighted open deals expected to close in the period. Revenue counts when a deal is Closed Won.
          </Callout>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Team target" value={idrShort(team.target)} hint={period.label} icon={<Target className="size-4" />} tone="primary" />
            <StatCard label="Closed" value={idrShort(team.closed)} hint={<>{ratio(team.closed, team.target)}% attained · <PaceBadge pace={teamPace} /></>} icon={<Wallet className="size-4" />} tone="success" />
            <StatCard label="Projected" value={idrShort(team.projected)} hint={`${ratio(team.projected, team.target)}% of target`} icon={<TrendingUp className="size-4" />} tone="secondary" />
            <StatCard label="Gap to target" value={idrShort(Math.max(team.target - team.projected, 0))} hint={team.projected >= team.target ? "covered by pipeline" : "needs new pipeline"} tone={team.projected >= team.target ? "success" : "danger"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{period.months.length === 1 ? "Cumulative closed revenue vs target" : "Target vs closed by month"}</CardTitle>
              <CardDescription>Rp million · team total</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                {period.months.length === 1 && period.id === CURRENT_MONTH ? (
                  <ComposedChart data={monthChart}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" {...axisProps} interval={4} /><YAxis {...axisProps} width={48} />
                    <RT contentStyle={chartTip} labelFormatter={(d) => `Day ${d}`} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
                    <Line dataKey="target" name="Target pace" stroke="var(--chart-4)" strokeDasharray="5 4" dot={false} strokeWidth={1.5} />
                    <Line dataKey="actual" name="Closed" stroke="var(--chart-1)" dot={false} strokeWidth={2.5} connectNulls={false} />
                    <Line dataKey="projected" name="Projected" stroke="var(--chart-2)" strokeDasharray="3 3" dot={false} strokeWidth={2} />
                  </ComposedChart>
                ) : (
                  <BarChart data={quarterChart} barGap={4}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="m" {...axisProps} /><YAxis {...axisProps} width={48} />
                    <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Target" fill="var(--chart-5)" radius={4} /><Bar dataKey="Closed" fill="var(--chart-1)" radius={4} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {behind.length > 0 && share > 0 && share < 1 && (
            <p className="text-sm text-muted-foreground"><b className="text-foreground">{behind.length} reps</b> are at risk or behind: {behind.map((r) => r.rep.name.split(" ")[0]).join(", ")}.</p>
          )}

          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Rep</TableHead><TableHead className="text-right">Target</TableHead><TableHead className="text-right">Closed</TableHead>
                <TableHead className="w-52">Attainment</TableHead><TableHead>Pace</TableHead><TableHead className="text-right">Weighted pipeline</TableHead>
                <TableHead className="text-right">Projected</TableHead><TableHead className="text-right">Gap</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.rep.id}>
                    <TableCell><RepCell id={r.rep.id} sub={r.rep.status !== "Active" ? <span className="text-warning">{r.rep.status}</span> : r.rep.role} /></TableCell>
                    <TableCell className="text-right tabular-nums">{r.target ? idrShort(r.target) : <span className="text-danger">Not set</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{idrShort(r.closed)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="font-medium">{r.target ? `${r.att}%` : "—"}</span><span className="text-muted-foreground">expected {Math.round(share * 100)}%</span></div>
                        <div className="relative h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={r.att} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.rep.name} attainment`}>
                          <div className={cn("h-full rounded-full", r.pace === "Behind" ? "bg-danger" : r.pace === "At risk" ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(r.att, 100)}%` }} />
                          {share > 0 && share < 1 && <span className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${share * 100}%` }} title="Expected by today" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><PaceBadge pace={r.pace} /></TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{idrShort(r.weighted)}</TableCell>
                    <TableCell className="text-right tabular-nums">{idrShort(r.projected)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", r.gap > 0 ? "text-danger" : "text-success")}>{r.gap > 0 ? idrShort(r.gap) : "Covered"}</TableCell>
                    <TableCell className="text-right"><Button size="icon-sm" variant="ghost" aria-label={`Edit ${r.rep.name}'s targets`} onClick={() => setEditing(r.rep.id)}><Pencil /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="mt-4"><Commission /></TabsContent>
      </Tabs>

      {editing && <EditTargets repId={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function EditTargets({ repId, onClose }: { repId: string; onClose: () => void }) {
  const { targets } = useApp()
  const rep = repById(repId)!
  const [quarter, setQuarter] = useState("Q4 2026")
  const qMonths = quarters[quarter]
  const [vals, setVals] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  useEffect(() => { setVals(Object.fromEntries(qMonths.map((m) => [m, String(Math.round((targets[repId]?.[m] ?? 0) / M))]))); setError("") }, [quarter]) // eslint-disable-line react-hooks/exhaustive-deps
  const locked = (m: Month) => m < CURRENT_MONTH // closed months can't be changed
  const total = qMonths.reduce((s, m) => s + clamp(vals[m] ?? "", 0), 0)
  const prevQ = quarter === "Q4 2026" ? quarters["Q3 2026"] : null
  const prevActual = prevQ ? prevQ.reduce((s, m) => s + (actuals[repId]?.[m] ?? 0), 0) : 0

  const save = () => {
    const out: Partial<Record<Month, number>> = {}
    for (const m of qMonths) {
      if (locked(m)) continue
      const raw = vals[m]
      const n = Number(raw)
      if (raw === "" || !Number.isFinite(n)) return setError(`Enter a target for ${monthLabel(m)}.`)
      if (n < 0) return setError("Targets can't be negative.")
      if (n === 0 && rep.status === "Active") return setError(`${monthLabel(m)} is 0 — active reps need a target. Use a small number if they are ramping up.`)
      out[m] = n * M
    }
    setTargets(repId, out)
    toast.success(`Targets updated for ${rep.name}`, { description: qMonths.some(locked) ? "Past months are locked and were not changed." : undefined }); onClose()
  }
  const split = () => {
    const editable = qMonths.filter((m) => !locked(m))
    const lockedSum = qMonths.filter(locked).reduce((s, m) => s + clamp(vals[m] ?? "", 0), 0)
    const each = Math.max(0, Math.round((total - lockedSum) / editable.length))
    setVals({ ...vals, ...Object.fromEntries(editable.map((m) => [m, String(each)])) })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Revenue targets · {rep.name}</DialogTitle><DialogDescription>{rep.role} · values in Rp million</DialogDescription></DialogHeader>
        <SimpleSelect ariaLabel="Quarter" value={quarter} onChange={setQuarter} options={Object.keys(quarters).map((q) => ({ value: q, label: q }))} />
        {rep.status !== "Active" && <p className="rounded-md bg-warning/10 px-3 py-2 text-sm">{rep.name} is {rep.status.toLowerCase()}. Consider lowering targets for the leave period.</p>}
        <div className="grid gap-2">
          {qMonths.map((m) => (
            <label key={m} className="flex items-center gap-3">
              <span className="w-24 text-sm">{monthLabel(m)}</span>
              <div className="relative flex-1">
                <Input type="number" min={0} step={10} inputMode="numeric" value={vals[m] ?? ""} disabled={locked(m)} onChange={(e) => { setVals({ ...vals, [m]: e.target.value }); setError("") }} className="pr-10" aria-label={`Target ${monthLabel(m)}`} />
                <span className="absolute top-2 right-2.5 text-xs text-muted-foreground">M</span>
              </div>
              <span className="w-24 text-right text-xs text-muted-foreground">{locked(m) ? <span className="inline-flex items-center gap-1"><Lock className="size-3" />closed {idrShort(actuals[repId]?.[m] ?? 0)}</span> : m === CURRENT_MONTH ? <Badge variant="outline">current</Badge> : ""}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm">
          <span>Quarter total <b>{idr(total * M)}</b></span>
          <Button size="xs" variant="outline" onClick={split} disabled={qMonths.every(locked)}>Split evenly</Button>
        </div>
        {prevQ && <p className="text-xs text-muted-foreground">Reference: closed {idrShort(prevActual)} in Q3 2026.</p>}
        <FormError>{error}</FormError>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={qMonths.every(locked)} onClick={save}>Save targets</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Commission() {
  const { targets } = useApp()
  const plan = (role: string) => commissionPlans.find((p) => p.applies === role) ?? commissionPlans[0]
  const rows = sellers.map((r) => {
    const target = targets[r.id]?.[CURRENT_MONTH] ?? 0
    const closed = actuals[r.id]?.[CURRENT_MONTH] ?? 0
    const p = plan(r.role)
    const base = target > 0 ? Math.min(closed, target) : closed
    const over = target > 0 ? Math.max(closed - target, 0) : 0
    return { r, target, closed, p, payout: (base * p.base) / 100 + (over * p.accelerator) / 100 }
  })
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="overflow-hidden lg:col-span-2">
        <CardHeader><CardTitle>Estimated payout · {monthLabel(CURRENT_MONTH)}</CardTitle><CardDescription>Month-to-date. Final payout uses paid invoices only.</CardDescription></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead>Rep</TableHead><TableHead>Plan</TableHead><TableHead className="text-right">Closed</TableHead><TableHead className="text-right">Target</TableHead><TableHead className="text-right">Payout</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(({ r, target, closed, p, payout }) => (
                <TableRow key={r.id}>
                  <TableCell><RepCell id={r.id} /></TableCell><TableCell className="text-sm text-muted-foreground">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{idrShort(closed)}</TableCell><TableCell className="text-right tabular-nums">{idrShort(target)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{idr(payout)}</TableCell>
                </TableRow>
              ))}
              <TableRow><TableCell colSpan={4} className="font-medium">Total</TableCell><TableCell className="text-right font-semibold tabular-nums">{idr(rows.reduce((s, x) => s + x.payout, 0))}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Commission plans</CardTitle><CardDescription>Base rate up to target, accelerator above it</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {commissionPlans.map((p) => (
            <div key={p.id} className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between font-medium">{p.name}<Badge variant="secondary">{p.applies}</Badge></div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Base<div className="text-base font-semibold text-foreground">{p.base}%</div></div>
                <div>Accelerator<div className="text-base font-semibold text-foreground">{p.accelerator}%</div></div>
                <div>Threshold<div className="text-base font-semibold text-foreground">{p.threshold}%</div></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
