import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip as RT, XAxis, YAxis } from "recharts"
import { AlarmClock, BellRing, CheckCircle2, Circle, CircleDollarSign, Download, FileWarning, Plus, Receipt, Search, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Callout, EmptyState, Field, PageHeader, RepCell, SimpleSelect, StatCard, StatusBadge, axisProps, chartTip } from "@/components/common/bits"
import { aging, cashflow, invoices as seed, paymentTerms, termById, type Installment, type Invoice, type InvoiceStatus } from "@/data/finance"
import { quotes } from "@/data/mock"
import { TODAY, addDays, fmtDate, idr, idrShort, isValidDate, nextId, ratio } from "@/lib/format"
import { cn } from "@/lib/utils"

const tabs: ("All" | InvoiceStatus)[] = ["All", "Draft", "Sent", "Partially paid", "Overdue", "Paid"]

function schedule(total: number, termId: string, issued: string): Installment[] {
  return termById(termId).steps.map((s, k) => ({ label: s.label, pct: s.pct, amount: Math.round((total * s.pct) / 100), due: addDays(issued, s.days + k * 20), status: "Due" }))
}

export default function Invoices() {
  const [rows, setRows] = useState<Invoice[]>(seed)
  const [tab, setTab] = useState<(typeof tabs)[number]>("All")
  const [q, setQ] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = rows.find((r) => r.id === detailId) ?? null

  const approved = quotes.filter((x) => x.status === "Accepted" || x.status === "Viewed")
  const [open, setOpen] = useState(false)
  const [quoteId, setQuoteId] = useState(approved[0]?.id ?? "")
  const [termId, setTermId] = useState("pt2")
  const [issued, setIssued] = useState(TODAY)
  const quote = quotes.find((x) => x.id === quoteId)
  const preview = useMemo(() => (quote ? schedule(quote.total, termId, issued) : []), [quote, termId, issued])

  const outstanding = rows.filter((r) => r.status !== "Void" && r.status !== "Draft").reduce((s, r) => s + (r.total - r.paid), 0)
  const overdue = rows.flatMap((r) => r.installments).filter((x) => x.status === "Overdue").reduce((s, x) => s + x.amount, 0)
  const paidOct = rows.flatMap((r) => r.installments).filter((x) => x.paidAt?.startsWith("2026-10")).reduce((s, x) => s + x.amount, 0)
  const list = rows.filter((r) => (tab === "All" || r.status === tab) && `${r.id} ${r.company}`.toLowerCase().includes(q.trim().toLowerCase()))

  const needsApproval = termById(termId).needsApproval
  const formError = !quote ? "There is no accepted quote to bill yet." : !isValidDate(issued) ? "Issue date is required." : ""
  const create = (asDraft: boolean) => {
    if (!quote || formError) return
    const held = !asDraft && needsApproval
    const total = quote.total
    const inv: Invoice = {
      id: nextId("INV-2610-", rows.filter((r) => r.id.startsWith("INV-2610-")).map((r) => r.id), 3), quoteId: quote.id, company: quote.company, owner: quote.owner, issued,
      due: preview[preview.length - 1].due, subtotal: Math.round(total / 1.11), tax: total - Math.round(total / 1.11), total, paid: 0,
      status: asDraft || held ? "Draft" : "Sent", termId, installments: preview,
    }
    setRows([inv, ...rows]); setOpen(false)
    if (held) toast.warning(`${inv.id} is waiting for Finance approval`, { description: "See Approvals." })
    else toast.success(asDraft ? `${inv.id} saved as draft` : `${inv.id} issued and sent to ${inv.company}`)
  }

  const recordPayment = (inv: Invoice, idx: number) => {
    if (inv.installments[idx]?.status === "Paid") return // guard against double clicks
    setRows((all) => all.map((r) => {
      if (r.id !== inv.id || r.installments[idx].status === "Paid") return r
      const installments = r.installments.map((x, i) => (i === idx ? { ...x, status: "Paid" as const, paidAt: TODAY } : x))
      const paid = installments.filter((x) => x.status === "Paid").reduce((s, x) => s + x.amount, 0)
      const late = installments.some((x) => x.status === "Overdue")
      return { ...r, installments, paid, status: paid >= r.total ? "Paid" : late ? "Overdue" : "Partially paid" }
    }))
    toast.success(`Payment recorded for ${inv.installments[idx].label}`)
  }

  return (
    <>
      <PageHeader title="Invoices" desc="Customer invoices, installment schedules and payments received.">
        <Button variant="outline" onClick={() => toast.info("Invoice export (mock)")}><Download />Export</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}><Plus />New invoice</DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>New invoice</DialogTitle><DialogDescription>Created from a quote. The installment schedule follows the selected payment term.</DialogDescription></DialogHeader>
            <div className="grid gap-4">
              {approved.length === 0 ? (
                <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">No accepted quotes yet. Invoices are created from quotes the client accepted.</p>
              ) : (
                <Field label="From quote"><SimpleSelect className="w-full" value={quoteId} onChange={setQuoteId} options={approved.map((x) => ({ value: x.id, label: `${x.id} · ${x.company} · ${idrShort(x.total)}` }))} /></Field>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Payment term"><SimpleSelect className="w-full" value={termId} onChange={setTermId} options={paymentTerms.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))} /></Field>
                <Field label="Issue date"><Input type="date" value={issued} required aria-invalid={!isValidDate(issued)} onChange={(e) => setIssued(e.target.value)} /></Field>
              </div>
              {needsApproval && <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs">This term needs Finance approval before the invoice is sent.</p>}
              <div className="rounded-lg border">
                <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-medium text-muted-foreground"><span>Payment schedule</span><span>{quote ? idr(quote.total) : "-"}</span></div>
                {preview.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div><span className="font-medium">{p.label}</span> <span className="text-muted-foreground">· {p.pct}%</span><div className="text-xs text-muted-foreground">Due {fmtDate(p.due)}</div></div>
                    <span className="tabular-nums">{idr(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              {formError && <p role="alert" className="mr-auto self-center text-sm text-danger">{formError}</p>}
              <Button variant="outline" disabled={!!formError} onClick={() => create(true)}>Save draft</Button>
              <Button disabled={!!formError} onClick={() => create(false)}>{needsApproval ? "Request approval" : "Issue & send"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Callout title="Billing flow">Accepted quote → <b>create invoice</b> → installments generated from <b>Payment Terms</b> → record each payment. Overdue installments turn red and show up in Sales Division alerts.</Callout>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Outstanding receivables" value={idrShort(outstanding)} hint={`${rows.filter((r) => r.paid < r.total && r.status !== "Draft" && r.status !== "Void").length} open invoices`} icon={<Wallet className="size-4" />} tone="primary" />
        <StatCard label="Overdue" value={idrShort(overdue)} hint="needs collection" icon={<FileWarning className="size-4" />} tone="danger" />
        <StatCard label="Collected in October" value={idrShort(paidOct)} delta={-12.4} hint="vs September" icon={<CircleDollarSign className="size-4" />} tone="success" />
        <StatCard label="Days sales outstanding" value="38 days" delta={-4} deltaGoodWhen="down" hint="target ≤ 35" icon={<AlarmClock className="size-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Billed vs collected</CardTitle><CardDescription>Rp million per month</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={cashflow} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="m" {...axisProps} /><YAxis {...axisProps} width={40} />
                <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="billed" name="Billed" fill="var(--chart-5)" radius={4} /><Bar dataKey="collected" name="Collected" fill="var(--chart-1)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Receivables aging</CardTitle><CardDescription>Older buckets carry more risk</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={aging} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide /><YAxis type="category" dataKey="bucket" width={100} {...axisProps} />
                <RT contentStyle={chartTip} cursor={{ fill: "var(--muted)" }} formatter={(v) => idr(Number(v))} />
                <Bar dataKey="value" name="Value" radius={4} barSize={18}>
                  {aging.map((_, i) => <Cell key={i} fill={["var(--chart-1)", "var(--chart-3)", "var(--warning)", "var(--danger)", "var(--danger)"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof tabs)[number])}><TabsList>{tabs.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList></Tabs>
        <div className="relative w-full sm:w-64"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice number or client…" className="w-full pl-8" /></div>
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Client</TableHead><TableHead>Payment term</TableHead><TableHead className="w-48">Paid</TableHead><TableHead>Status</TableHead><TableHead>Final due</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((r) => {
              const p = ratio(r.paid, r.total)
              return (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetailId(r.id)}>
                  <TableCell className="font-mono text-xs">{r.id}<div className="text-muted-foreground">from {r.quoteId}</div></TableCell>
                  <TableCell><div className="font-medium">{r.company}</div><RepCell id={r.owner} /></TableCell>
                  <TableCell><div className="text-sm">{termById(r.termId).name}</div><div className="text-xs text-muted-foreground">{r.installments.filter((x) => x.status === "Paid").length}/{r.installments.length} installments paid</div></TableCell>
                  <TableCell><div className="space-y-1"><div className="flex justify-between text-xs"><span>{idrShort(r.paid)}</span><span className="text-muted-foreground">{p}%</span></div><Progress value={p} /></div></TableCell>
                  <TableCell><StatusBadge value={r.status} /></TableCell>
                  <TableCell>{fmtDate(r.due)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{idr(r.total)}</TableCell>
                </TableRow>
              )
            })}
            {list.length === 0 && <TableRow><TableCell colSpan={7}><EmptyState title="No invoices" desc={q ? "No invoice matches your search." : `No ${tab.toLowerCase()} invoices.`} action={(q || tab !== "All") && <Button variant="outline" size="sm" onClick={() => { setQ(""); setTab("All") }}>Clear filters</Button>} /></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><Receipt className="size-4" />{detail.id}</SheetTitle>
                <SheetDescription>{detail.company} · issued {fmtDate(detail.issued)} · {termById(detail.termId).name}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 overflow-y-auto px-4 pb-6 text-sm">
                <div className="flex items-center gap-2"><StatusBadge value={detail.status} /><span className="text-muted-foreground">Ref. {detail.quoteId}</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {([["Total", detail.total], ["Paid", detail.paid], ["Balance", detail.total - detail.paid]] as const).map(([l, v]) => (
                    <div key={l} className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="font-semibold tabular-nums">{idrShort(v)}</div></div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{idr(detail.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">VAT 11%</span><span>{idr(detail.tax)}</span></div>
                </div>
                <Separator />
                <div>
                  <p className="mb-3 font-medium">Installments</p>
                  <ol className="relative space-y-4 border-l pl-5">
                    {detail.installments.map((x, i) => (
                      <li key={i} className="relative">
                        <span className="absolute top-0.5 -left-[27px] bg-background">
                          {x.status === "Paid" ? <CheckCircle2 className="size-4 text-success" /> : <Circle className={cn("size-4", x.status === "Overdue" ? "text-danger" : "text-muted-foreground")} />}
                        </span>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{x.label} <span className="font-normal text-muted-foreground">· {x.pct}%</span></div>
                            <div className="text-xs text-muted-foreground">{x.status === "Paid" ? `Paid ${fmtDate(x.paidAt)}` : `Due ${fmtDate(x.due)}`}</div>
                          </div>
                          <div className="text-right"><div className="tabular-nums">{idr(x.amount)}</div><StatusBadge value={x.status} /></div>
                        </div>
                        {x.status !== "Paid" && detail.status !== "Draft" && detail.status !== "Void" && (
                          <div className="mt-2 flex gap-2">
                            <Button size="xs" onClick={() => recordPayment(detail, i)}>Record payment</Button>
                            <Button size="xs" variant="outline" onClick={() => toast.success(`Reminder sent to ${detail.company}`)}><BellRing />Send reminder</Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => toast.info("PDF download (mock)")}><Download />Download PDF</Button>
                  {detail.status === "Draft" && <Button onClick={() => { setRows(rows.map((r) => r.id === detail.id ? { ...r, status: "Sent" } : r)); toast.success("Invoice issued") }}>Issue</Button>}
                  {detail.paid === 0 && detail.status !== "Void" && <Button variant="destructive" onClick={() => {
                    const prev = detail.status
                    setRows(rows.map((r) => r.id === detail.id ? { ...r, status: "Void" } : r))
                    toast(`${detail.id} voided`, { action: { label: "Undo", onClick: () => setRows((all) => all.map((r) => r.id === detail.id ? { ...r, status: prev } : r)) } })
                  }}>Void</Button>}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
