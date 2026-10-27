import { useMemo, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as RT, XAxis, YAxis } from "recharts"
import { CalendarClock, Download, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, SimpleSelect, StatCard, axisProps, chartTip } from "@/components/common/bits"
import { probabilityOf, useApp } from "@/data/store"
import { activityTrend, lossReasons, pipelineTrend, productMix, winLoss } from "@/data/division"
import { aging, cashflow } from "@/data/finance"
import { monthly, sourcePerf } from "@/data/mock"
import { gradeOf, grades, sellers, stages } from "@/data/sales"
import { areas } from "@/data/geo"
import { CURRENT_MONTH, actuals } from "@/data/targets"
import { idr, idrShort } from "@/lib/format"

const C = (n: number) => `var(--chart-${n})`
const ramp = [C(1), C(2), C(3), C(4), C(5)]

function ChartCard({ title, desc, className, h = "h-72", children }: { title: string; desc?: string; className?: string; h?: string; children: React.ReactElement }) {
  return (
    <Card className={className}>
      <CardHeader><CardTitle>{title}</CardTitle>{desc && <CardDescription>{desc}</CardDescription>}</CardHeader>
      <CardContent className={h}><ResponsiveContainer>{children}</ResponsiveContainer></CardContent>
    </Card>
  )
}

const scheduledSeed = [
  { id: "s1", name: "Weekly sales summary", freq: "Every Monday 07:00", to: "Directors, Managers", on: true },
  { id: "s2", name: "Overdue receivables", freq: "Daily 08:00", to: "Finance", on: true },
  { id: "s3", name: "Leads past follow-up SLA", freq: "Daily 08:30", to: "Managers", on: true },
  { id: "s4", name: "Monthly rep scorecard", freq: "1st of month 07:00", to: "Managers", on: false },
]

export default function Analytics() {
  const { deals, leads, quality, targets } = useApp()
  const [period, setPeriod] = useState("6m")
  const [sched, setSched] = useState(scheduledSeed)
  const byRep = sellers.map((r) => ({ name: r.name.split(" ")[0], Target: Math.round((targets[r.id]?.[CURRENT_MONTH] ?? 0) / 1e6), Closed: Math.round((actuals[r.id]?.[CURRENT_MONTH] ?? 0) / 1e6) }))
  const byStage = stages.map((s) => ({ name: s, value: Math.round(deals.filter((d) => d.stage === s).reduce((a, d) => a + d.value, 0) / 1e6) }))
  const conv = sourcePerf.map((s) => ({ ...s, rate: Math.round((s.won / s.leads) * 100) }))
  const forecast = deals.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost").reduce((s, d) => s + (d.value * probabilityOf(d)) / 100, 0)
  const qualityBySource = useMemo(() => [...new Set(leads.map((l) => l.source))].map((src) => {
    const row: Record<string, string | number> = { source: src }
    grades.forEach((g) => { row[g] = leads.filter((l) => l.source === src && gradeOf(l.score, l.fit, quality) === g).length })
    return row
  }), [leads, quality])
  const leadsByArea = areas.map((a) => ({ area: a.short, Assigned: leads.filter((l) => l.area === a.id && l.owner).length, Unassigned: leads.filter((l) => l.area === a.id && !l.owner).length }))

  return (
    <>
      <PageHeader title="Analytics" desc="Charts for revenue, pipeline, leads, activity and finance.">
        <SimpleSelect ariaLabel="Period" value={period} onChange={setPeriod} options={[{ value: "30d", label: "Last 30 days" }, { value: "6m", label: "Last 6 months" }, { value: "ytd", label: "Year to date" }]} />
        <Button variant="outline" onClick={() => toast.info("PDF export (mock)")}><Download />Export</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue, 6 months" value={idrShort(monthly.reduce((s, m) => s + m.actual, 0) * 1e6)} delta={9.2} />
        <StatCard label="Weighted forecast" value={idrShort(forecast)} hint="open deals × probability" />
        <StatCard label="Win rate" value="41%" delta={3.4} hint="of closed deals" />
        <StatCard label="Average deal size" value={idrShort(deals.reduce((s, d) => s + d.value, 0) / Math.max(deals.length, 1))} delta={3.1} />
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Revenue</TabsTrigger><TabsTrigger value="pipeline">Pipeline</TabsTrigger><TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="finance">Finance</TabsTrigger><TabsTrigger value="schedule">Scheduled reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4 grid gap-4 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title="Revenue vs target" desc="Rp million per month">
            <AreaChart data={monthly}>
              <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C(1)} stopOpacity={0.2} /><stop offset="100%" stopColor={C(1)} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="m" {...axisProps} /><YAxis {...axisProps} width={48} />
              <RT contentStyle={chartTip} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="target" name="Target" stroke={C(4)} strokeDasharray="5 4" fill="none" strokeWidth={1.5} />
              <Area dataKey="actual" name="Closed" stroke={C(1)} fill="url(#ga)" strokeWidth={2.5} />
            </AreaChart>
          </ChartCard>
          <ChartCard title="Product mix" desc="Revenue share (Rp million)">
            <PieChart>
              <Pie data={productMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{productMix.map((_, i) => <Cell key={i} fill={ramp[i]} />)}</Pie>
              <RT contentStyle={chartTip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartCard>
          <ChartCard className="lg:col-span-3" title="Target vs closed per rep · October" desc="Rp million">
            <BarChart data={byRep} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="name" {...axisProps} /><YAxis {...axisProps} width={48} />
              <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Target" fill={C(5)} radius={4} /><Bar dataKey="Closed" fill={C(1)} radius={4} />
            </BarChart>
          </ChartCard>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4 grid gap-4 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title="Pipeline growth by stage" desc="Open deal value (Rp million) at month end">
            <BarChart data={pipelineTrend}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="m" {...axisProps} /><YAxis {...axisProps} width={48} />
              <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {["Prospecting", "Qualification", "Proposal", "Negotiation"].map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={[C(5), C(3), C(2), C(1)][i]} radius={i === 3 ? [4, 4, 0, 0] : 0} />)}
            </BarChart>
          </ChartCard>
          <ChartCard title="Deal outcomes" desc="Deals created in the last 6 months">
            <PieChart>
              <Pie data={winLoss} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{winLoss.map((_, i) => <Cell key={i} fill={["var(--success)", "var(--danger)", C(5)][i]} />)}</Pie>
              <RT contentStyle={chartTip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartCard>
          <ChartCard title="Value by stage now" desc="Rp million">
            <BarChart data={byStage}><XAxis dataKey="name" {...axisProps} fontSize={10} /><YAxis {...axisProps} width={40} /><RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="value" name="Value" radius={4}>{byStage.map((_, i) => <Cell key={i} fill={i === 4 ? "var(--success)" : [C(5), C(3), C(2), C(1)][i]} />)}</Bar></BarChart>
          </ChartCard>
          <ChartCard title="Lost reasons" desc="Number of deals">
            <BarChart data={lossReasons} layout="vertical" margin={{ left: 10 }}><XAxis type="number" hide /><YAxis type="category" dataKey="reason" width={120} {...axisProps} fontSize={11} />
              <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="count" name="Deals" fill={C(4)} radius={4} barSize={14} /></BarChart>
          </ChartCard>
          <ChartCard title="Conversion by lead source" desc="Leads (bars), win rate (line)">
            <ComposedChart data={conv}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="source" {...axisProps} fontSize={10} />
              <YAxis yAxisId="l" {...axisProps} width={32} /><YAxis yAxisId="r" orientation="right" {...axisProps} width={36} unit="%" />
              <RT contentStyle={chartTip} /><Bar yAxisId="l" dataKey="leads" name="Leads" fill={C(5)} radius={4} />
              <Line yAxisId="r" dataKey="rate" name="Win rate" stroke={C(1)} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ChartCard>
        </TabsContent>

        <TabsContent value="leads" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Lead quality by source" desc="Number of leads per grade">
            <BarChart data={qualityBySource}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="source" {...axisProps} fontSize={10} /><YAxis {...axisProps} width={28} allowDecimals={false} />
              <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {grades.map((g, i) => <Bar key={g} dataKey={g} name={`Grade ${g}`} stackId="g" fill={["var(--primary)", "var(--brand-2)", C(4), C(5)][i]} radius={i === 3 ? [4, 4, 0, 0] : 0} />)}
            </BarChart>
          </ChartCard>
          <ChartCard title="Leads by territory" desc="Assigned vs unassigned">
            <BarChart data={leadsByArea}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="area" {...axisProps} fontSize={10} interval={0} angle={-25} textAnchor="end" height={50} /><YAxis {...axisProps} width={28} allowDecimals={false} />
              <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Assigned" stackId="a" fill={C(1)} /><Bar dataKey="Unassigned" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 grid gap-4 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title="Team activity trend" desc="Per week">
            <LineChart data={activityTrend}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="w" {...axisProps} /><YAxis {...axisProps} width={40} />
              <RT contentStyle={chartTip} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="Email" stroke={C(5)} strokeWidth={2} dot={false} /><Line dataKey="Call" stroke={C(3)} strokeWidth={2} dot={false} />
              <Line dataKey="Meeting" stroke={C(2)} strokeWidth={2.5} dot={false} /><Line dataKey="Visit" stroke={C(1)} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartCard>
          <Card>
            <CardHeader><CardTitle>Activity → outcome ratios</CardTitle><CardDescription>Division average this month</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {[["Calls per meeting", "3.4"], ["Visits per proposal", "1.8"], ["Meetings per proposal", "2.1"], ["Activities per won deal", "38"]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">{l}</span><span className="text-xl font-semibold tabular-nums">{v}</span></div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Billed vs collected" desc="Rp million">
            <AreaChart data={cashflow}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="m" {...axisProps} /><YAxis {...axisProps} width={40} />
              <RT contentStyle={chartTip} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="billed" name="Billed" stroke={C(3)} fill={C(3)} fillOpacity={0.12} strokeWidth={2} />
              <Area dataKey="collected" name="Collected" stroke={C(1)} fill={C(1)} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ChartCard>
          <ChartCard title="Receivables aging" desc="Outstanding value by age">
            <BarChart data={aging}>
              <XAxis dataKey="bucket" {...axisProps} fontSize={11} /><YAxis {...axisProps} width={52} tickFormatter={(v) => idrShort(v).replace("Rp ", "")} />
              <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} formatter={(v) => idr(Number(v))} />
              <Bar dataKey="value" name="Value" radius={4}>{aging.map((_, i) => <Cell key={i} fill={i === 0 ? C(1) : i === 1 ? C(3) : i === 2 ? "var(--warning)" : "var(--danger)"} fillOpacity={i === 4 ? 1 : i === 3 ? 0.75 : 1} />)}</Bar>
            </BarChart>
          </ChartCard>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4 grid max-w-3xl gap-3">
          {sched.map((s) => (
            <Card key={s.id} size="sm"><CardContent className="flex items-center gap-4">
              <span className="grid size-9 place-items-center rounded-md bg-muted"><CalendarClock className="size-4" /></span>
              <div className="min-w-0 flex-1"><div className="font-medium">{s.name}</div><div className="flex items-center gap-1 text-xs text-muted-foreground">{s.freq} · <Mail className="size-3" />{s.to}</div></div>
              <Switch checked={s.on} onCheckedChange={(c) => setSched(sched.map((x) => x.id === s.id ? { ...x, on: c } : x))} aria-label={s.name} />
            </CardContent></Card>
          ))}
          <Button variant="outline" className="w-fit" onClick={() => toast.info("New scheduled report (mock)")}>+ Scheduled report</Button>
        </TabsContent>
      </Tabs>
    </>
  )
}
