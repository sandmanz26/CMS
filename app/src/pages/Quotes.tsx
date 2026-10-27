import { useState } from "react"
import { Plus, Receipt, Trash2, Send } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Callout, Field, PageHeader, RepCell, SimpleSelect, StatCard, StatusBadge } from "@/components/common/bits"
import { paymentTerms } from "@/data/finance"
import { ME } from "@/data/sales"
import { accounts, products, quotes as seed, type Quote } from "@/data/mock"
import { TODAY, addDays, clamp, fmtDate, idr, idrShort, nextId, ratio } from "@/lib/format"

type Line = { pid: string; qty: number; disc: number }

export default function Quotes() {
  const [rows, setRows] = useState<Quote[]>(seed)
  const [open, setOpen] = useState(false)
  const [acc, setAcc] = useState(accounts[0].name)
  const [term, setTerm] = useState("pt2")
  const [lines, setLines] = useState<Line[]>([{ pid: "p2", qty: 10, disc: 0 }])
  const prod = (id: string) => products.find((p) => p.id === id)!
  const sub = lines.reduce((s, l) => s + prod(l.pid).price * l.qty * (1 - l.disc / 100), 0)
  const vat = sub * 0.11
  const needsApproval = lines.some((l) => l.disc > 10)
  const setLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, x) => (x === i ? { ...l, ...patch } : l)))

  const invalid = lines.length === 0 ? "Add at least one product." : sub <= 0 ? "The quote total must be above 0." : ""
  const create = () => {
    if (invalid) return
    setRows([{ id: nextId("QT-2610-", rows.map((r) => r.id), 3), company: acc, contact: "—", total: sub + vat, status: needsApproval ? "Draft" : "Sent", owner: ME, issued: TODAY, validUntil: addDays(TODAY, 30), items: lines.length, version: 1 }, ...rows])
    setOpen(false); toast.success(needsApproval ? "Saved as draft — waiting for manager approval" : "Quote sent to the client")
  }
  const sum = (s: Quote["status"]) => rows.filter((r) => r.status === s).reduce((a, r) => a + r.total, 0)

  return (
    <>
      <PageHeader title="Quotes" desc="Create, send and track price quotes.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}><Plus />New quote</DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>New quote</DialogTitle><DialogDescription>Discounts above 10% need manager approval.</DialogDescription></DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Account"><SimpleSelect className="w-full" value={acc} onChange={setAcc} options={accounts.map((a) => ({ value: a.name, label: a.name }))} /></Field>
                <Field label="Payment term"><SimpleSelect className="w-full" value={term} onChange={setTerm} options={paymentTerms.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))} /></Field>
              </div>
              <div className="space-y-2">
                <div className="hidden grid-cols-[minmax(0,1fr)_5rem_5rem_2rem] gap-2 px-0.5 text-xs text-muted-foreground sm:grid"><span>Product</span><span>Qty</span><span>Discount %</span><span /></div>
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_2rem] items-center gap-2 max-sm:border-b max-sm:pb-2 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_2rem]">
                    <SimpleSelect className="col-span-3 w-full sm:col-span-1" value={l.pid} onChange={(v) => setLine(i, { pid: v })} options={products.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name }))} />
                    <Input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: clamp(e.target.value, 1, 10000) })} aria-label="Quantity" />
                    <Input type="number" min={0} max={100} value={l.disc} onChange={(e) => setLine(i, { disc: clamp(e.target.value, 0, 100) })} aria-label="Discount %" placeholder="%" />
                    <Button variant="ghost" size="icon-sm" onClick={() => setLines(lines.filter((_, x) => x !== i))} aria-label="Remove line"><Trash2 /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setLines([...lines, { pid: "p1", qty: 1, disc: 0 }])}><Plus />Add line</Button>
              </div>
              <Separator />
              <div className="ml-auto w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{idr(sub)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">VAT 11%</span><span>{idr(vat)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>{idr(sub + vat)}</span></div>
                {needsApproval && <p className="text-xs text-warning">Needs manager approval (discount &gt; 10%)</p>}
              </div>
            </div>
            <DialogFooter>{invalid && <p role="alert" className="mr-auto self-center text-sm text-danger">{invalid}</p>}<Button disabled={!!invalid} onClick={create}><Send />{needsApproval ? "Request approval" : "Send quote"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Callout title="Quote lifecycle">Draft → Sent → Viewed → Accepted / Declined. An <b>accepted</b> quote becomes an invoice with its payment term. Every revision bumps the version (v2, v3…).</Callout>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Draft" value={idrShort(sum("Draft"))} />
        <StatCard label="Awaiting response" value={idrShort(sum("Sent") + sum("Viewed"))} />
        <StatCard label="Accepted" value={idrShort(sum("Accepted"))} tone="success" />
        <StatCard label="Quote win rate" value={`${ratio(rows.filter((r) => r.status === "Accepted").length, rows.length)}%`} />
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Client</TableHead><TableHead>Status</TableHead><TableHead>Rep</TableHead><TableHead>Issued</TableHead><TableHead>Valid until</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id} <span className="text-muted-foreground">v{r.version}</span></TableCell>
                <TableCell><div className="font-medium">{r.company}</div><div className="text-xs text-muted-foreground">{r.items} items · {r.contact}</div></TableCell>
                <TableCell><StatusBadge value={r.status} /></TableCell><TableCell><RepCell id={r.owner} /></TableCell>
                <TableCell>{fmtDate(r.issued)}</TableCell><TableCell>{fmtDate(r.validUntil)}</TableCell>
                <TableCell className="text-right tabular-nums">{idr(r.total)}</TableCell>
                <TableCell className="text-right">{r.status === "Accepted" && <Button size="xs" variant="outline" render={<Link to="/invoices" />}><Receipt />Create invoice</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
