import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRightLeft, CalendarClock, FileText, Mail, MapPin, Phone, Plus, Share2, Sparkles, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, GradeBadge, Meta, RepCell, ScoreBar, SimpleSelect, StatusBadge } from "@/components/common/bits"
import { LogActivityDialog, activityIcon } from "@/components/sales/LogActivityDialog"
import { ReassignDialog } from "@/components/sales/ReassignDialog"
import { TerritoryMap } from "@/components/sales/TerritoryMap"
import { addDeal, updateLead, updateMaterial, useApp } from "@/data/store"
import { isStale } from "@/data/alerts"
import { ME, activitiesOf, activityTypes, fitBonus, gradeMeta, gradeOf, lastTouches, leadStatuses, repById, repName, type ActivityType, type LeadStatus } from "@/data/sales"
import { effectiveStatus } from "@/data/enablement"
import { areaById } from "@/data/geo"
import { TODAY, addDays, daysAgo, fmtDate, fmtDateTime, idr, idrShort, relDays } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { leads, activities, transfers, deals, materials, quality } = useApp()
  const lead = leads.find((l) => l.id === id)
  const [logType, setLogType] = useState<ActivityType | null>(null)
  const [reassign, setReassign] = useState(false)
  const [filter, setFilter] = useState<ActivityType | "All">("All")
  const [shareId, setShareId] = useState("")

  const timeline = useMemo(() => {
    if (!lead) return []
    const acts = activitiesOf(activities, lead.id).map((a) => ({ kind: "activity" as const, at: a.at, a }))
    const moves = transfers.filter((t) => t.leadId === lead.id).map((t) => ({ kind: "transfer" as const, at: t.at, t }))
    const created = { kind: "created" as const, at: `${lead.createdAt}T08:00:00` }
    return [...acts, ...moves, created].sort((x, y) => y.at.localeCompare(x.at))
  }, [lead, activities, transfers])

  if (!lead) {
    return <EmptyState title="Lead not found" desc={`There is no lead with id “${id}”. It may have been deleted or merged.`} action={<Button variant="outline" render={<Link to="/leads" />}><ArrowLeft />Back to leads</Button>} />
  }

  const grade = gradeOf(lead.score, lead.fit, quality)
  const touch = lastTouches(activities, lead.id)
  const stale = isStale(lead, activities, quality)
  const sla = quality.sla[grade]
  const sinceTouch = daysAgo(touch.any?.at ?? lead.createdAt) ?? 0
  const nextDue = daysAgo(lead.nextFollowUp)
  const owner = repById(lead.owner)
  const area = areaById(lead.area)
  const leadDeals = deals.filter((d) => d.leadId === lead.id)
  const shared = materials.filter((m) => m.shares.some((s) => s.leadId === lead.id))
  const shareable = materials.filter((m) => effectiveStatus(m) === "Published" && !m.shares.some((s) => s.leadId === lead.id))
  const ownership = transfers.filter((t) => t.leadId === lead.id).sort((a, b) => b.at.localeCompare(a.at))
  const shown = timeline.filter((x) => filter === "All" || (x.kind === "activity" && x.a.type === filter))
  const canConvert = lead.status !== "Converted" && lead.status !== "Unqualified" && !!lead.owner

  const convert = () => {
    if (!lead.owner) return toast.error("Assign an owner before converting to a deal.")
    const dealId = addDeal({ title: "New opportunity", company: lead.company, leadId: lead.id, owner: lead.owner, value: lead.value, stage: "Prospecting", closeDate: addDays(TODAY, 45), createdAt: TODAY, stageSince: TODAY, checks: [], nextStep: "Identify decision maker", overrides: [] })
    updateLead(lead.id, { status: "Converted", nextFollowUp: null })
    toast.success(`Converted to deal ${dealId}`, { action: { label: "Open pipeline", onClick: () => navigate("/pipeline") } })
  }

  const lastCards: { label: string; type: ActivityType; act: typeof touch.visit }[] = [
    { label: "Last visit", type: "Visit", act: touch.visit },
    { label: "Last meeting", type: "Meeting", act: touch.meeting },
    { label: "Last follow-up", type: "Follow-up", act: touch.followUp },
    { label: "Last call", type: "Call", act: touch.call },
  ]

  return (
    <>
      <Link to="/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Leads</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{lead.name}</h1>
            <GradeBadge grade={grade} />
            <StatusBadge value={lead.status} />
            {lead.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
          <p className="text-sm text-muted-foreground">{lead.title} · {lead.company} · {lead.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setLogType("Call")}><Plus />Log activity</Button>
          <Button variant="outline" onClick={() => setReassign(true)}>{lead.owner ? <><ArrowRightLeft />Reassign</> : <><UserPlus />Assign owner</>}</Button>
          <Button variant="outline" disabled={!canConvert} title={!canConvert ? (lead.status === "Converted" ? "Already converted" : !lead.owner ? "Assign an owner first" : "Unqualified leads can't be converted") : undefined} onClick={convert}>Convert to deal</Button>
        </div>
      </div>

      {(stale || (owner && owner.status !== "Active") || !lead.owner) && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm">
          <CalendarClock className="size-4 shrink-0" />
          <span className="flex-1">
            {!lead.owner ? "This lead has no owner — nobody is following it up." :
              owner && owner.status !== "Active" ? `Owner ${owner.name} is ${owner.status.toLowerCase()}. Consider reassigning.` :
              `No touch for ${sinceTouch} days — grade ${grade} leads need contact every ${sla} days.`}
          </span>
          {(!lead.owner || (owner && owner.status !== "Active")) ? <Button size="sm" onClick={() => setReassign(true)}>Reassign</Button> : <Button size="sm" onClick={() => setLogType("Follow-up")}>Log follow-up</Button>}
        </div>
      )}

      {/* When was this lead last touched — by kind */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {lastCards.map((c) => {
          const I = activityIcon[c.type]
          return (
            <Card key={c.label} size="sm">
              <CardContent className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><I className="size-3.5" />{c.label}</div>
                {c.act ? (
                  <>
                    <div className="text-lg font-semibold">{relDays(c.act.at)}</div>
                    <div className="truncate text-xs text-muted-foreground">{fmtDate(c.act.at)} · {repName(c.act.by).split(" ")[0]}</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-muted-foreground">Never</div>
                    <button className="text-xs font-medium text-primary hover:underline" onClick={() => setLogType(c.type)}>Log {c.type.toLowerCase()}</button>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
        <Card size="sm" className={cn("col-span-2 lg:col-span-1", nextDue !== null && nextDue > 0 && "border-danger/40")}>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />Next follow-up</div>
            <div className={cn("text-lg font-semibold", nextDue !== null && nextDue > 0 && "text-danger")}>{lead.nextFollowUp ? (nextDue !== null && nextDue > 0 ? `Overdue ${nextDue}d` : relDays(lead.nextFollowUp)) : "Not planned"}</div>
            <div className="text-xs text-muted-foreground">SLA for grade {grade}: every {sla} days · {stale ? <span className="text-danger">past SLA</span> : "within SLA"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
            <div><CardTitle>Activity history</CardTitle><CardDescription>{touch.count} activities · last touch {relDays(touch.any?.at)}</CardDescription></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter activities">
              {(["All", ...activityTypes] as const).map((t) => (
                <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t} className={cn("rounded-full border px-2.5 py-0.5 text-xs", filter === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{t}</button>
              ))}
            </div>
            {shown.length === 0 && <EmptyState title={`No ${filter === "All" ? "activity" : filter.toLowerCase()} yet`} desc="Log the first one so the team knows what's happening." action={<Button size="sm" variant="outline" onClick={() => setLogType(filter === "All" ? "Call" : filter)}>Log {filter === "All" ? "activity" : filter.toLowerCase()}</Button>} />}
            <ol className="relative space-y-5 border-l pl-6">
              {shown.map((x, i) => {
                if (x.kind === "created") return (
                  <li key="created" className="relative"><span className="absolute top-0.5 -left-[33px] grid size-5 place-items-center rounded-full bg-muted ring-4 ring-card"><Sparkles className="size-3" /></span>
                    <div className="text-sm"><span className="font-medium">Lead created</span> <span className="text-muted-foreground">from {lead.source}</span></div><div className="text-xs text-muted-foreground">{fmtDate(lead.createdAt)}</div></li>
                )
                if (x.kind === "transfer") return (
                  <li key={x.t.id} className="relative"><span className="absolute top-0.5 -left-[33px] grid size-5 place-items-center rounded-full bg-brand-2/15 text-brand-2 ring-4 ring-card"><ArrowRightLeft className="size-3" /></span>
                    <div className="text-sm"><span className="font-medium">{x.t.from ? `Reassigned from ${repName(x.t.from)} to ${repName(x.t.to)}` : `Assigned to ${repName(x.t.to)}`}</span></div>
                    <div className="text-xs text-muted-foreground">{fmtDateTime(x.t.at)} · by {repName(x.t.by)} · {x.t.reason}</div>
                    {x.t.note && <p className="mt-1 rounded-md bg-muted/60 px-2.5 py-1.5 text-sm">{x.t.note}</p>}</li>
                )
                const I = activityIcon[x.a.type]
                return (
                  <li key={x.a.id + i} className="relative">
                    <span className="absolute top-0.5 -left-[33px] grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-card"><I className="size-3" /></span>
                    <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{x.a.type}</span><span className="text-muted-foreground">by {repName(x.a.by)}</span>{x.a.type !== "Note" && <StatusBadge value={x.a.outcome} />}</div>
                    <div className="text-xs text-muted-foreground">{fmtDateTime(x.a.at)} · {relDays(x.a.at)}</div>
                    <p className="mt-1 text-sm">{x.a.note}</p>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Owner</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <RepCell id={lead.owner} size="default" sub={owner ? `${owner.role} · ${owner.status}${lead.ownerSince ? ` · since ${fmtDate(lead.ownerSince)}` : ""}` : "Nobody is following up"} />
              {ownership.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <div className="text-xs font-medium text-muted-foreground">Ownership history</div>
                  {ownership.map((t) => (
                    <div key={t.id} className="text-xs"><span className="font-medium">{t.from ? `${repName(t.from)} → ${repName(t.to)}` : `→ ${repName(t.to)}`}</span><div className="text-muted-foreground">{fmtDate(t.at)} · {t.reason}</div></div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lead quality</CardTitle><CardDescription>{gradeMeta[grade].desc}</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Engagement score</span><ScoreBar score={lead.score} /></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">ICP fit</span><span>{lead.fit} ({fitBonus[lead.fit] >= 0 ? "+" : ""}{fitBonus[lead.fit]})</span></div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {lead.score} {fitBonus[lead.fit] >= 0 ? "+" : "−"} {Math.abs(fitBonus[lead.fit])} = <b className="text-foreground">{lead.score + fitBonus[lead.fit]}</b> → Grade {grade}.
                Thresholds: A ≥ {quality.aMin}{quality.requireStrongFitForA ? " (strong fit only)" : ""}, B ≥ {quality.bMin}, C ≥ {quality.cMin}.
              </div>
              <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Lifecycle status</span>
                <SimpleSelect className="w-40" value={lead.status} onChange={(v) => { updateLead(lead.id, { status: v as LeadStatus }); toast.success(`Status changed to ${v}`) }}
                  options={leadStatuses.map((s) => ({ value: s, label: s, disabled: s === "Converted" && !leadDeals.length }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact & territory</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid grid-cols-2 gap-3">
                <Meta label="Email"><a className="text-primary hover:underline" href={`mailto:${lead.email}`}><Mail className="mr-1 inline size-3" />{lead.email}</a></Meta>
                <Meta label="Phone"><Phone className="mr-1 inline size-3" />{lead.phone}</Meta>
                <Meta label="Industry">{lead.industry}</Meta>
                <Meta label="Source">{lead.source}</Meta>
                <Meta label="Area"><MapPin className="mr-1 inline size-3" />{area?.name}</Meta>
                <Meta label="City">{lead.city}</Meta>
                <Meta label="Est. value">{idr(lead.value)}</Meta>
                <Meta label="Created">{fmtDate(lead.createdAt)}</Meta>
              </dl>
              <div className="rounded-lg border bg-background p-1"><TerritoryMap leads={[lead]} quality={quality} selected={lead.area} compact /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Deals</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {leadDeals.length === 0 && <p className="text-muted-foreground">No deal yet. Convert once the lead is qualified.</p>}
              {leadDeals.map((d) => (
                <Link key={d.id} to="/pipeline" className="flex items-center justify-between gap-2 rounded-md border p-2.5 hover:bg-muted/50">
                  <span className="min-w-0"><span className="block truncate font-medium">{d.title}</span><span className="text-xs text-muted-foreground">{d.id} · {idrShort(d.value)}</span></span><StatusBadge value={d.stage} />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Materials shared</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {shared.length === 0 && <p className="text-muted-foreground">Nothing shared yet.</p>}
              {shared.map((m) => {
                const s = m.shares.find((x) => x.leadId === lead.id)!
                return <div key={m.id} className="flex items-center gap-2"><FileText className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{m.title}</span><span className="text-xs text-muted-foreground">{relDays(s.at)}</span></div>
              })}
              <div className="flex gap-2 pt-1">
                <SimpleSelect className="min-w-0 flex-1" value={shareId} onChange={setShareId} placeholder={shareable.length ? "Choose material…" : "No published material left"} disabled={!shareable.length} options={shareable.map((m) => ({ value: m.id, label: m.title }))} />
                <Button variant="outline" disabled={!shareId} onClick={() => {
                  updateMaterial(shareId, (m) => ({ shares: [...m.shares, { leadId: lead.id, by: lead.owner ?? ME, at: TODAY }] }))
                  toast.success("Material shared with lead"); setShareId("")
                }}><Share2 />Share</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {logType && <LogActivityDialog lead={lead} open={!!logType} defaultType={logType} onOpenChange={(o) => !o && setLogType(null)} />}
      <ReassignDialog leadIds={[lead.id]} open={reassign} onOpenChange={setReassign} />
    </>
  )
}
