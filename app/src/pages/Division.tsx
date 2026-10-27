import { useState } from "react"
import { Link } from "react-router-dom"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Legend, Tooltip as RT } from "recharts"
import { AlertOctagon, AlertTriangle, ArrowRight, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Callout, PaceBadge, PageHeader, RepAvatar, RepCell, SectionTitle, SimpleSelect, chartTip, toneDot, toneSoft, type Tone } from "@/components/common/bits"
import { useApp } from "@/data/store"
import { isStale, useAlerts } from "@/data/alerts"
import { activityHeat, repScores, teams } from "@/data/division"
import { repById } from "@/data/sales"
import { CURRENT_MONTH, actuals, elapsed, paceOf } from "@/data/targets"
import { idrShort, ratio } from "@/lib/format"
import { cn } from "@/lib/utils"

type Health = "Healthy" | "At risk" | "Critical"
const healthTone: Record<Health, Tone> = { Healthy: "success", "At risk": "warning", Critical: "danger" }
const grade = (v: number, good: number, warn: number, lowerIsBetter = false): Health =>
  lowerIsBetter ? (v <= good ? "Healthy" : v <= warn ? "At risk" : "Critical") : v >= good ? "Healthy" : v >= warn ? "At risk" : "Critical"

function HealthPill({ h }: { h: Health }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", toneSoft[healthTone[h]])}><span className={cn("size-1.5 rounded-full", toneDot[healthTone[h]])} />{h}</span>
}

function Gauge({ value, color }: { value: number; color: string }) {
  const r = 80, cx = 100, cy = 100, from = -120, sweep = 240
  const pt = (deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
  const arc = (a: number, b: number) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `M ${x1} ${y1} A ${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x2} ${y2}` }
  return (
    <svg viewBox="0 0 200 170" className="h-full w-full" role="img" aria-label={`Score ${value} of 100`}>
      <path d={arc(from, from + sweep)} stroke="var(--muted)" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d={arc(from, from + (sweep * Math.max(1, Math.min(value, 100))) / 100)} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" />
    </svg>
  )
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const heat = (n: number) => n === 0 ? "bg-muted" : n < 8 ? "bg-primary/15" : n < 12 ? "bg-primary/35" : n < 16 ? "bg-primary/60" : "bg-primary"

export default function Division() {
  const { leads, activities, quality, targets } = useApp()
  const alerts = useAlerts()
  const [team, setTeam] = useState("all")
  const ts = teams.filter((t) => team === "all" || t.id === team)
  const memberIds = ts.flatMap((t) => t.members)
  const scores = repScores.filter((r) => memberIds.includes(r.id))
  const share = elapsed([CURRENT_MONTH])

  const tgt = (id: string) => targets[id]?.[CURRENT_MONTH] ?? 0
  const act = (id: string) => actuals[id]?.[CURRENT_MONTH] ?? 0
  const target = memberIds.reduce((s, id) => s + tgt(id), 0)
  const closed = memberIds.reduce((s, id) => s + act(id), 0)
  const attainment = ratio(closed, target)
  const expected = Math.round(share * 100)
  const coverage = +(ts.reduce((s, t) => s + t.pipeline, 0) / Math.max(target - closed, 1) / 3).toFixed(1)
  const winRate = Math.round(ts.reduce((s, t) => s + t.winRate, 0) / ts.length)
  const cycle = Math.round(ts.reduce((s, t) => s + t.cycle, 0) / ts.length)
  const owned = leads.filter((l) => l.owner && memberIds.includes(l.owner))
  const stale = owned.filter((l) => isStale(l, activities, quality))
  const slaRate = owned.length ? Math.round((1 - stale.length / owned.length) * 100) : 100

  const indicators = [
    { label: "Target attainment", value: `${attainment}%`, h: grade(attainment / Math.max(expected, 1), 0.95, 0.8), hint: `Expected ${expected}% by today` },
    { label: "Pipeline coverage", value: `${coverage}×`, h: grade(coverage, 3, 2), hint: "Open pipeline vs remaining target; healthy ≥ 3×" },
    { label: "Win rate", value: `${winRate}%`, h: grade(winRate, 30, 22), hint: "Deals won ÷ deals closed" },
    { label: "Sales cycle", value: `${cycle} days`, h: grade(cycle, 32, 42, true), hint: "Average lead → won" },
    { label: "Follow-ups within SLA", value: `${slaRate}%`, h: grade(slaRate, 85, 70), hint: "Owned leads touched within their grade's SLA" },
  ]
  const score = Math.round(indicators.reduce((s, i) => s + (i.h === "Healthy" ? 100 : i.h === "At risk" ? 60 : 25), 0) / indicators.length)
  const overall: Health = score >= 80 ? "Healthy" : score >= 55 ? "At risk" : "Critical"

  const radar = ["Target", "Win rate", "Speed", "Activity", "Coverage"].map((k) => {
    const row: Record<string, string | number> = { k }
    teams.forEach((t) => {
      const tt = t.members.reduce((s, id) => s + tgt(id), 0), ta = t.members.reduce((s, id) => s + act(id), 0)
      row[t.name] = k === "Target" ? ratio(ta, tt) : k === "Win rate" ? t.winRate * 2.5 : k === "Speed" ? Math.round(100 - t.cycle) : k === "Activity" ? Math.round(t.activities / 4.5) : Math.round((t.pipeline / Math.max(tt, 1)) * 25)
    })
    return row
  })

  return (
    <>
      <PageHeader title="Sales Division" desc="Health of the division, each team and each rep — on one screen.">
        <SimpleSelect ariaLabel="Team" value={team} onChange={setTeam} options={[{ value: "all", label: "All teams" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]} />
      </PageHeader>

      <Callout title="How to read this page">Each indicator is rated Healthy, At risk or Critical against the threshold in its tooltip. The division score averages them. Every alert links to where you can act on it.</Callout>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle>Division health</CardTitle><CardDescription>{ts.length === 1 ? ts[0].name : "All teams"} · October</CardDescription></CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative h-40 w-full">
              <Gauge value={score} color={overall === "Healthy" ? "var(--success)" : overall === "At risk" ? "var(--warning)" : "var(--danger)"} />
              <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-4xl font-semibold tabular-nums">{score}</div><div className="text-xs text-muted-foreground">out of 100</div></div></div>
            </div>
            <HealthPill h={overall} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            {indicators.map((i) => (
              <Tooltip key={i.label}>
                <TooltipTrigger render={<div className="cursor-help rounded-lg border bg-card p-3" />}>
                  <div className="text-xs text-muted-foreground">{i.label}</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">{i.value}</div>
                  <div className="mt-1.5"><HealthPill h={i.h} /></div>
                </TooltipTrigger>
                <TooltipContent>{i.hint}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Alerts & actions</CardTitle><CardDescription>Most urgent first</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((a) => {
                const I = a.level === "critical" ? AlertOctagon : a.level === "warning" ? AlertTriangle : Info
                return (
                  <Link key={a.id} to={a.link} className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <I className={cn("mt-0.5 size-4 shrink-0", a.level === "critical" ? "text-danger" : a.level === "warning" ? "text-warning" : "text-brand-2")} />
                    <div className="min-w-0 flex-1"><div className="text-sm font-medium">{a.title}</div><div className="text-xs text-muted-foreground">{a.detail}</div></div>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <SectionTitle title="Teams" desc="Regional teams side by side" />
      <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-[repeat(3,minmax(0,1fr))_340px]">
        {teams.map((t) => {
          const tt = t.members.reduce((s, id) => s + tgt(id), 0), ta = t.members.reduce((s, id) => s + act(id), 0)
          const pace = paceOf(ta, tt, share)
          return (
            <Card key={t.id} className={cn(team !== "all" && team !== t.id && "opacity-50")}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.region}</div></div><PaceBadge pace={pace} /></div>
                <div className="flex -space-x-1.5">{t.members.map((m) => <RepAvatar key={m} id={m} className="size-7 ring-2 ring-card" />)}</div>
                <div className="space-y-1"><div className="flex justify-between text-sm"><span>{idrShort(ta)}</span><span className="font-medium">{ratio(ta, tt)}%</span></div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(ratio(ta, tt), 100)}%` }} /><span className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: `${share * 100}%` }} /></div>
                  <div className="text-xs text-muted-foreground">of {idrShort(tt)} target</div></div>
                <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
                  <div><div className="text-muted-foreground">Pipeline</div><div className="font-semibold">{idrShort(t.pipeline)}</div></div>
                  <div><div className="text-muted-foreground">Win rate</div><div className="font-semibold">{t.winRate}%</div></div>
                  <div><div className="text-muted-foreground">Cycle</div><div className="font-semibold">{t.cycle}d</div></div>
                </div>
                <div className="text-xs text-muted-foreground">Manager: {repById(t.manager)?.name}</div>
              </CardContent>
            </Card>
          )
        })}
        <Card className="md:col-span-3 2xl:col-span-1">
          <CardHeader><CardTitle>Team profile</CardTitle><CardDescription>Scale 0–100</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="var(--border)" /><PolarAngleAxis dataKey="k" fontSize={11} stroke="var(--muted-foreground)" />
                {teams.map((t, i) => <Radar key={t.id} dataKey={t.name} stroke={`var(--chart-${i + 1})`} fill={`var(--chart-${i + 1})`} fillOpacity={0.12} />)}
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><RT contentStyle={chartTip} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle title="Rep scorecard" desc="Status combines target pace, pipeline coverage, activity and follow-up discipline" />
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Rep</TableHead><TableHead>Status</TableHead><TableHead className="w-40">Target (Oct)</TableHead><TableHead className="text-right">Coverage</TableHead>
            <TableHead className="text-right">Win rate</TableHead><TableHead className="text-right">Visit / Meet / Call</TableHead><TableHead className="text-right">Leads owned</TableHead>
            <TableHead className="text-right">Past SLA</TableHead><TableHead>Last login</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {scores.map((s) => {
              const r = repById(s.id)!; const p = ratio(act(s.id), tgt(s.id))
              const mine = leads.filter((l) => l.owner === s.id && l.status !== "Converted" && l.status !== "Unqualified")
              const late = mine.filter((l) => isStale(l, activities, quality)).length
              const hs = [grade(p / Math.max(expected, 1), 0.95, 0.8), grade(s.coverage, 2.5, 1.8), grade(s.calls + s.meetings + s.visits, 45, 25), grade(mine.length ? 1 - late / mine.length : 1, 0.85, 0.7)]
              const h: Health = r.status !== "Active" ? "At risk" : hs.includes("Critical") ? "Critical" : hs.includes("At risk") ? "At risk" : "Healthy"
              return (
                <TableRow key={s.id}>
                  <TableCell><RepCell id={s.id} sub={`${r.role}${r.status !== "Active" ? ` · ${r.status}` : ""}`} /></TableCell>
                  <TableCell><HealthPill h={h} /></TableCell>
                  <TableCell><div className="space-y-1"><div className="flex justify-between text-xs"><span>{idrShort(act(s.id))}</span><span>{p}%</span></div><div className="relative h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(p, 100)}%` }} /><span className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: `${share * 100}%` }} /></div></div></TableCell>
                  <TableCell className={cn("text-right tabular-nums", s.coverage < 1.8 && "font-medium text-danger")}>{s.coverage}×</TableCell>
                  <TableCell className="text-right tabular-nums">{s.winRate}%</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{s.visits} / {s.meetings} / {s.calls}</TableCell>
                  <TableCell className="text-right tabular-nums"><Link className="hover:underline" to={`/leads?owner=${s.id}`}>{mine.length}</Link></TableCell>
                  <TableCell className={cn("text-right tabular-nums", late && "font-medium text-danger")}>{late}</TableCell>
                  <TableCell className={cn("text-sm", s.lastLogin.includes("days ago") ? "text-danger" : "text-muted-foreground")}>{s.lastLogin}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activity this week</CardTitle><CardDescription>Visits, meetings, calls and emails per day. Empty = no activity logged.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid min-w-[480px] grid-cols-[180px_repeat(5,1fr)] gap-1.5 text-xs">
            <span />{days.map((d) => <span key={d} className="text-center text-muted-foreground">{d}</span>)}
            {memberIds.map((id) => (
              <div key={id} className="contents">
                <span className="self-center truncate text-sm">{repById(id)?.name}</span>
                {activityHeat[id].map((n, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger render={<div className={cn("grid h-9 place-items-center rounded-md font-medium", heat(n), n >= 16 && "text-primary-foreground")} />}>{n || ""}</TooltipTrigger>
                    <TooltipContent>{repById(id)?.name} · {days[i]}: {n} activities</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">Fewer {[0, 5, 10, 14, 18].map((n) => <span key={n} className={cn("size-3.5 rounded", heat(n))} />)} More</div>
        </CardContent>
      </Card>
    </>
  )
}
