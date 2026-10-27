import { useMemo } from "react"
import { daysAgo, plural } from "@/lib/format"
import { useApp } from "./store"
import { gradeOf, lastTouches, repById, type Lead, type QualityRules, type Activity } from "./sales"
import { effectiveStatus } from "./enablement"
import { staticAlerts, type Alert } from "./division"

/** A lead is stale when its last real touch is older than the SLA of its grade. */
export function isStale(l: Lead, activities: Activity[], q: QualityRules) {
  if (l.status === "Converted" || l.status === "Unqualified" || !l.owner) return false
  const last = lastTouches(activities, l.id).any
  const d = daysAgo(last?.at ?? l.createdAt) ?? 0
  return d > q.sla[gradeOf(l.score, l.fit, q)]
}

/** Live alerts derived from the store plus a few static ones. */
export function useAlerts(): Alert[] {
  const s = useApp()
  return useMemo(() => {
    const out: Alert[] = []
    const unassigned = s.leads.filter((l) => !l.owner)
    const stale = s.leads.filter((l) => isStale(l, s.activities, s.quality))
    const onLeave = s.leads.filter((l) => l.owner && repById(l.owner)?.status !== "Active" && l.status !== "Converted")
    const expiring = s.materials.filter((m) => effectiveStatus(m) === "Published" && m.expires && (daysAgo(m.expires) ?? 0) >= -7)
    if (onLeave.length) out.push({ id: "dyn-leave", level: "critical", title: `${plural(onLeave.length, "lead")} owned by a rep on leave`, detail: "Reassign them so follow-ups don't stall.", link: "/leads?view=attention" })
    if (stale.length) out.push({ id: "dyn-stale", level: "warning", title: `${plural(stale.length, "lead")} past follow-up SLA`, detail: "No visit, call or follow-up within the SLA for their grade.", link: "/leads?view=stale" })
    if (unassigned.length) out.push({ id: "dyn-unassigned", level: "warning", title: `${plural(unassigned.length, "lead")} without an owner`, detail: "New leads are waiting to be assigned.", link: "/leads?view=unassigned" })
    if (expiring.length) out.push({ id: "dyn-exp", level: "info", title: `${plural(expiring.length, "material")} expiring within 7 days`, detail: expiring.map((m) => m.title).join(", "), link: "/materials" })
    return [...out, ...staticAlerts]
  }, [s])
}
