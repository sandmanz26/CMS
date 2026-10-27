import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RT, XAxis, YAxis } from "recharts"
import { AlertOctagon, AlertTriangle, ArrowRight, Handshake, Info, Plus, Target, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GradeBadge, PaceBadge, RepCell, StatCard, StatusBadge, axisProps, chartTip } from "@/components/common/bits"
import { probabilityOf, useApp } from "@/data/store"
import { useAlerts, isStale } from "@/data/alerts"
import { gradeOf, grades, repById, sellers } from "@/data/sales"
import { CURRENT_MONTH, actuals, elapsed, paceOf } from "@/data/targets"
import { activityFeed, monthly, tasks } from "@/data/mock"
import { TODAY, fmtDate, idrShort, ratio } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { leads, deals, activities, quality, targets } = useApp()
  const alerts = useAlerts()
  const share = elapsed([CURRENT_MONTH])

  const target = sellers.reduce((s, r) => s + (targets[r.id]?.[CURRENT_MONTH] ?? 0), 0)
  const closed = sellers.reduce((s, r) => s + (actuals[r.id]?.[CURRENT_MONTH] ?? 0), 0)
  const pace = paceOf(closed, target, share)
  const open = deals.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost")
  const weighted = open.reduce((s, d) => s + (d.value * probabilityOf(d)) / 100, 0)
  const attention = leads.filter((l) => !l.owner || isStale(l, activities, quality)).length
  const gradeCounts = useMemo(() => Object.fromEntries(grades.map((g) => [g, leads.filter((l) => l.status !== "Converted" && l.status !== "Unqualified" && gradeOf(l.score, l.fit, quality) === g).length])) as Record<string, number>, [leads, quality])
  const activeLeads = Object.values(gradeCounts).reduce((a, b) => a + b, 0)
  const board = sellers.map((r) => {
    const t = targets[r.id]?.[CURRENT_MONTH] ?? 0, c = actuals[r.id]?.[CURRENT_MONTH] ?? 0
    return { r, t, c, att: ratio(c, t), pace: paceOf(c, t, share) }
  }).sort((a, b) => b.att - a.att)
  const today = tasks.filter((t) => t.due === TODAY)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{fmtDate(TODAY)}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Good morning, Hendra</h1>
          <p className="mt-1 text-sm text-muted-foreground">The team has closed <b className="text-foreground">{ratio(closed, target)}%</b> of October's target with {Math.round((1 - share) * 31)} days to go.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link to="/targets" />}>Revenue targets</Button>
          <Button render={<Link to="/leads" />}><Plus />Add lead</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={idrShort(closed)} hint={<>of {idrShort(target)} · <PaceBadge pace={pace} /></>} icon={<Target className="size-4" />} tone="primary" />
        <StatCard label="Weighted pipeline" value={idrShort(weighted)} hint={`${open.length} open deals`} icon={<Handshake className="size-4" />} tone="secondary" />
        <StatCard label="Leads needing attention" value={attention} hint="past SLA or unassigned" icon={<Users className="size-4" />} tone={attention ? "warning" : "success"} />
        <StatCard label="Win rate (90 days)" value="41%" delta={3.4} hint="vs previous 90 days" icon={<Trophy className="size-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue vs target</CardTitle><CardDescription>Rp million · October is month-to-date</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" {...axisProps} /><YAxis {...axisProps} width={48} />
                <RT contentStyle={chartTip} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
                <Area dataKey="target" name="Target" stroke="var(--chart-4)" strokeDasharray="5 4" fill="none" strokeWidth={1.5} />
                <Area dataKey="actual" name="Closed" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#dg)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Lead quality</CardTitle><CardDescription>{activeLeads} active leads</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {grades.map((g, i) => <span key={g} style={{ width: `${activeLeads ? (gradeCounts[g] / activeLeads) * 100 : 0}%`, background: ["var(--primary)", "var(--brand-2)", "var(--chart-4)", "var(--chart-5)"][i] }} />)}
            </div>
            {grades.map((g) => (
              <Link key={g} to="/leads" className="flex items-center justify-between rounded-md px-1 py-0.5 hover:bg-muted">
                <GradeBadge grade={g} /><span className="text-sm tabular-nums">{gradeCounts[g]} <span className="text-muted-foreground">· {activeLeads ? Math.round((gradeCounts[g] / activeLeads) * 100) : 0}%</span></span>
              </Link>
            ))}
            <Button variant="outline" className="w-full" render={<Link to="/territories" />}>View on map<ArrowRight /></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Needs attention</CardTitle><CardDescription>Sorted by urgency</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 6).map((a) => {
              const I = a.level === "critical" ? AlertOctagon : a.level === "warning" ? AlertTriangle : Info
              return (
                <Link key={a.id} to={a.link} className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <I className={cn("mt-0.5 size-4 shrink-0", a.level === "critical" ? "text-danger" : a.level === "warning" ? "text-warning" : "text-brand-2")} />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{a.title}</span><span className="line-clamp-2 text-xs text-muted-foreground">{a.detail}</span></span>
                </Link>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Target leaderboard</CardTitle><CardDescription>October attainment</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {board.map(({ r, att, pace: p }) => (
              <div key={r.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2"><RepCell id={r.id} /><div className="flex shrink-0 items-center gap-2"><span className="text-sm font-medium tabular-nums">{att}%</span><PaceBadge pace={p} /></div></div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(att, 100)}%` }} /><span className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: `${share * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Today</CardTitle><CardDescription>{today.length} tasks due</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {today.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0"><div className={cn("truncate text-sm font-medium", t.done && "line-through opacity-60")}>{t.title}</div><div className="text-xs text-muted-foreground">{t.type} · {repById(t.owner)?.name}</div></div>
                <StatusBadge value={t.priority} />
              </div>
            ))}
            <div className="space-y-3 border-t pt-3">
              <div className="text-xs font-medium text-muted-foreground">Recent activity</div>
              {activityFeed.slice(0, 4).map((a) => (
                <div key={a.id} className="text-sm"><span className="font-medium">{repById(a.who)?.name}</span> <span className="text-muted-foreground">{a.action}</span><div className="truncate text-xs text-muted-foreground">{a.target} · {a.time}</div></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
