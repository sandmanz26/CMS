import { useMemo, useState } from "react"
import { areas, islands, MAP_H, MAP_W, project, ringPath } from "@/data/geo"
import { gradeOf, repName, type Grade, type Lead, type QualityRules } from "@/data/sales"
import { idrShort, plural } from "@/lib/format"
import { cn } from "@/lib/utils"

export type MapMetric = "leads" | "value" | "unassigned"
const gradeFill: Record<Grade, string> = { A: "var(--primary)", B: "var(--brand-2)", C: "var(--chart-4)", D: "var(--chart-5)" }

/**
 * Schematic territory map. Bubbles = areas (size by the chosen metric), dots = individual leads (colour by grade).
 * Click an area to select it; click a lead dot to open it.
 */
export function TerritoryMap({ leads, quality, metric = "leads", selected, onSelect, onLead, showDots = true, compact = false }: {
  leads: Lead[]; quality: QualityRules; metric?: MapMetric; selected?: string | null; onSelect?: (areaId: string | null) => void
  onLead?: (id: string) => void; showDots?: boolean; compact?: boolean
}) {
  const [hover, setHover] = useState<string | null>(null)
  const stats = useMemo(() => Object.fromEntries(areas.map((a) => {
    const ls = leads.filter((l) => l.area === a.id)
    return [a.id, { count: ls.length, value: ls.reduce((s, l) => s + l.value, 0), unassigned: ls.filter((l) => !l.owner).length, hot: ls.filter((l) => gradeOf(l.score, l.fit, quality) === "A").length }]
  })), [leads, quality])
  const metricOf = (id: string) => (metric === "value" ? stats[id].value : metric === "unassigned" ? stats[id].unassigned : stats[id].count)
  const max = Math.max(1, ...areas.map((a) => metricOf(a.id)))
  const info = hover ?? selected ?? null

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="h-auto w-full" role="img" aria-label="Territory map of Indonesia">
        <rect width={MAP_W} height={MAP_H} fill="transparent" onClick={() => onSelect?.(null)} />
        {islands.map((i) => <path key={i.name} d={ringPath(i.ring)} fill="var(--muted)" stroke="var(--border)" strokeWidth={1.2} strokeLinejoin="round" />)}

        {showDots && leads.map((l) => {
          const [x, y] = project(l.coord)
          const g = gradeOf(l.score, l.fit, quality)
          const dim = selected && selected !== l.area
          return (
            <circle key={l.id} cx={x} cy={y} r={compact ? 3 : 3.6} fill={l.owner ? gradeFill[g] : "var(--background)"} stroke={l.owner ? "var(--background)" : "var(--danger)"} strokeWidth={l.owner ? 1 : 1.4}
              opacity={dim ? 0.25 : 0.95} className={cn(onLead && "cursor-pointer")} onClick={(e) => { e.stopPropagation(); onLead?.(l.id) }}>
              <title>{`${l.name} · ${l.company}\nGrade ${g} · ${repName(l.owner)}`}</title>
            </circle>
          )
        })}

        {areas.map((a) => {
          const [x, y] = project(a.center)
          const v = metricOf(a.id)
          const r = v === 0 ? 6 : 9 + 15 * Math.sqrt(v / max)
          const active = selected === a.id
          return (
            <g key={a.id} className="group/area cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-[3]" onClick={(e) => { e.stopPropagation(); onSelect?.(active ? null : a.id) }}
              onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(null)} role="button" tabIndex={0} aria-pressed={active}
              aria-label={`${a.name}: ${plural(stats[a.id].count, "lead")}`} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(active ? null : a.id) } }}>
              <circle cx={x} cy={y} r={r} fill="var(--card)" stroke="var(--primary)" strokeOpacity={active ? 0.9 : 0.4} strokeWidth={active ? 2 : 1} />
              <circle cx={x} cy={y} r={r} fill="var(--primary)" fillOpacity={active ? 0.25 : 0.08} />
              {!compact && (
                <>
                  <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--foreground)">{metric === "value" ? idrShort(v).replace("Rp ", "") : v}</text>
                  <text x={x} y={a.label === "above" ? y - r - 5 : y + r + 13} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">{a.short}</text>
                </>
              )}
            </g>
          )
        })}
      </svg>

      {info && !compact && (
        <div className="pointer-events-none absolute top-2 left-2 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
          <div className="font-medium">{areas.find((a) => a.id === info)?.name}</div>
          <div className="text-muted-foreground">{plural(stats[info].count, "lead")} · {stats[info].hot} hot · {stats[info].unassigned} unassigned · {idrShort(stats[info].value)}</div>
        </div>
      )}
    </div>
  )
}

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {(["A", "B", "C", "D"] as Grade[]).map((g) => <span key={g} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: gradeFill[g] }} />Grade {g}</span>)}
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-[1.5px] border-danger bg-background" />Unassigned</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border border-primary/40 bg-primary/10" />Area size = metric</span>
    </div>
  )
}
