import { useState } from "react"
import { BadgePercent, CalendarRange, Check, CreditCard, FileX2, Receipt, ShieldAlert, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Callout, EmptyState, PageHeader, RepCell, StatusBadge } from "@/components/common/bits"
import { approvals as seed, type Approval, type ApprovalType } from "@/data/finance"
import { fmtDate, idr } from "@/lib/format"

const typeIcon: Record<ApprovalType, typeof Receipt> = {
  Discount: BadgePercent, "Custom term": CalendarRange, "Manual invoice": Receipt, "Credit limit": CreditCard, Cancellation: FileX2, "Stage override": ShieldAlert,
}

export default function Approvals() {
  const [rows, setRows] = useState<Approval[]>(seed)
  const [tab, setTab] = useState<"pending" | "history">("pending")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const list = rows.filter((r) => (tab === "pending" ? r.status === "Pending" : r.status !== "Pending"))
  const decide = (id: string, status: "Approved" | "Rejected") => {
    if (status === "Rejected" && !notes[id]?.trim()) {
      toast.error("Add a reason before rejecting", { description: "The rep needs to know what to fix." })
      document.getElementById(`note-${id}`)?.focus()
      return
    }
    setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)))
    toast[status === "Approved" ? "success" : "error"](`Request ${status.toLowerCase()} — the rep has been notified`)
  }

  return (
    <>
      <PageHeader title="Approvals" desc="Decisions that are holding back quotes, invoices or credit changes." />
      <Callout title="Why approvals?">Anything outside policy — a discount above the limit, a non-standard term, a manual invoice, a higher credit limit — waits here. The approval level comes from the rules on the right.</Callout>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "history")}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({rows.filter((r) => r.status === "Pending").length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
          {list.map((r) => {
            const I = typeIcon[r.type]
            return (
              <Card key={r.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted"><I className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{r.type} · {r.company}</span><StatusBadge value={r.level} />{r.status !== "Pending" && <StatusBadge value={r.status} />}</div>
                      <div className="text-sm text-muted-foreground">{r.detail} · ref <span className="font-mono">{r.ref}</span></div>
                    </div>
                    <div className="text-right"><div className="font-semibold tabular-nums">{idr(r.amount)}</div><div className="text-xs text-muted-foreground">{fmtDate(r.date)}</div></div>
                  </div>
                  <div className="rounded-md bg-muted/60 p-3 text-sm"><span className="text-muted-foreground">Reason: </span>{r.reason}</div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">Requested by <RepCell id={r.requester} /></div>
                    {r.status === "Pending" && (
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                        <Textarea rows={1} id={`note-${r.id}`} placeholder="Note (required to reject)" className="min-h-8 w-full sm:w-56 sm:flex-1" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => decide(r.id, "Rejected")}><X />Reject</Button>
                        <Button className="flex-1 sm:flex-none" onClick={() => decide(r.id, "Approved")}><Check />Approve</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {list.length === 0 && <Card><EmptyState icon={<Check className="size-5" />} title={tab === "pending" ? "Nothing waiting" : "No decisions yet"} desc={tab === "pending" ? "You're all caught up." : undefined} /></Card>}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>Approval rules</CardTitle><CardDescription>Who must approve what</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              ["Discount above rep limit", "10", "%", "Manager"], ["Discount above manager limit", "20", "%", "Director"],
              ["Non-default payment term", "", "", "Finance"], ["Credit limit increase above", "250", "M", "Director"], ["Invoice without a quote", "", "", "Finance"],
              ["Pipeline stage override", "", "", "Manager"],
            ].map(([l, v, u, who]) => (
              <div key={l} className="flex items-center justify-between gap-2">
                <span className="flex-1">{l}</span>
                {v && <div className="relative w-20"><Input type="number" min={0} defaultValue={v} className="h-8 pr-7" aria-label={l} /><span className="absolute top-1.5 right-2 text-xs text-muted-foreground">{u}</span></div>}
                <StatusBadge value={who} />
              </div>
            ))}
            <Button className="w-full" variant="outline" onClick={() => toast.success("Rules saved (mock)")}>Save rules</Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
