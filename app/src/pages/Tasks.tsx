import { useState } from "react"
import { Briefcase, CalendarClock, Mail, MapPin, Phone, Repeat } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Callout, EmptyState, PageHeader, RepCell, StatusBadge } from "@/components/common/bits"
import { tasks as seed, type Task } from "@/data/mock"
import { TODAY, fmtDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const icons: Record<Task["type"], typeof Phone> = { Call: Phone, Meeting: Briefcase, Email: Mail, "Follow-up": Repeat, Visit: MapPin }

export default function Tasks() {
  const [rows, setRows] = useState(seed)
  const [tab, setTab] = useState<"open" | "done">("open")
  const list = rows.filter((t) => (tab === "open" ? !t.done : t.done)).sort((a, b) => a.due.localeCompare(b.due))
  return (
    <>
      <PageHeader title="Tasks" desc="Follow-ups, calls, visits and meetings across the team." />
      <Callout title="Automatic tasks">A follow-up task is created 3 days after a quote is sent, when a lead's next follow-up date arrives, and 1 day before an installment is due. Overdue tasks are shown in red.</Callout>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "open" | "done")}><TabsList><TabsTrigger value="open">Open ({rows.filter((t) => !t.done).length})</TabsTrigger><TabsTrigger value="done">Done</TabsTrigger></TabsList></Tabs>
      <Card><CardContent className="divide-y p-0">
        {list.map((t) => {
          const I = icons[t.type]; const late = !t.done && t.due < TODAY
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <Checkbox checked={t.done} onCheckedChange={(c) => setRows(rows.map((x) => x.id === t.id ? { ...x, done: !!c } : x))} aria-label={`Complete ${t.title}`} />
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted"><I className="size-4" /></div>
              <div className="min-w-0 flex-1"><div className={cn("truncate text-sm font-medium", t.done && "line-through opacity-60")}>{t.title}</div><div className="text-xs text-muted-foreground">{t.type} · {t.related}</div></div>
              <div className={cn("hidden items-center gap-1 text-xs sm:flex", late ? "text-danger" : "text-muted-foreground")}><CalendarClock className="size-3.5" />{t.due === TODAY ? "Today" : fmtDate(t.due)}{late && " (overdue)"}</div>
              <div className="hidden w-40 md:block"><RepCell id={t.owner} /></div><StatusBadge value={t.priority} />
            </div>
          )
        })}
        {list.length === 0 && <EmptyState title={tab === "open" ? "No open tasks" : "Nothing completed yet"} />}
      </CardContent></Card>
    </>
  )
}
