import { useState } from "react"
import { Mail, MapPin, Phone, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Callout, EmptyState, Field, PageHeader, RepCell, SimpleSelect, StatusBadge } from "@/components/common/bits"
import { accounts } from "@/data/mock"
import { useApp } from "@/data/store"
import { invoices, paymentTerms } from "@/data/finance"
import { fmtDate, idr, idrShort, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

const titles = ["President Director", "Operations Manager", "Head of IT", "Procurement", "Finance Manager"]

export default function Accounts() {
  const { leads, deals } = useApp()
  const [q, setQ] = useState("")
  const [tier, setTier] = useState("all")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [termOverride, setTermOverride] = useState<Record<string, string>>({})
  const rows = accounts.filter((a) => (tier === "all" || a.tier === tier) && a.name.toLowerCase().includes(q.trim().toLowerCase()))
  const a = accounts.find((x) => x.id === detailId) ?? null

  const contacts = a ? Array.from({ length: a.contacts }, (_, i) => {
    const l = leads[(accounts.indexOf(a) * 3 + i) % leads.length]
    return { name: l.name, title: titles[i % titles.length], email: l.email, phone: l.phone, primary: i === 0 }
  }) : []
  const accDeals = a ? deals.filter((d) => d.company === a.name) : []
  const accInv = a ? invoices.filter((v) => v.company === a.name) : []
  const defaultTerm = a ? paymentTerms.find((t) => t.defaultFor.includes(a.tier))?.id ?? "pt1" : "pt1"
  const credit = a ? (a.tier === "Enterprise" ? 750 : a.tier === "Mid-market" ? 350 : 150) * 1e6 : 0
  const used = accInv.reduce((s, v) => s + (v.total - v.paid), 0)

  return (
    <>
      <PageHeader title="Accounts" desc="Customer companies, their contacts, health and credit position.">
        <Button onClick={() => toast.info("New account form (mock)")}><Plus />Add account</Button>
      </PageHeader>
      <Callout title="Health score">Combines interaction frequency, on-time payments and product usage. Below 50 = churn risk. Click an account for details.</Callout>
      <div className="flex flex-wrap gap-2">
        <div className="relative w-full sm:w-64"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts…" className="w-full pl-8" /></div>
        <SimpleSelect ariaLabel="Tier" value={tier} onChange={setTier} options={[{ value: "all", label: "All tiers" }, { value: "Enterprise", label: "Enterprise" }, { value: "Mid-market", label: "Mid-market" }, { value: "SMB", label: "SMB" }]} />
      </div>
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Industry</TableHead><TableHead>City</TableHead><TableHead>Tier</TableHead><TableHead>Contacts</TableHead><TableHead>Account owner</TableHead><TableHead>Health</TableHead><TableHead className="text-right">Lifetime revenue</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((x) => (
              <TableRow key={x.id} className="cursor-pointer" onClick={() => setDetailId(x.id)}>
                <TableCell><div className="font-medium">{x.name}</div><div className="text-xs text-muted-foreground">{x.id}</div></TableCell>
                <TableCell>{x.industry}</TableCell><TableCell>{x.city}</TableCell><TableCell><StatusBadge value={x.tier} /></TableCell>
                <TableCell>{x.contacts}</TableCell><TableCell><RepCell id={x.owner} /></TableCell>
                <TableCell><div className="flex w-28 items-center gap-2"><Progress value={x.health} className={cn(x.health < 50 && "[&_[data-slot=progress-indicator]]:bg-danger")} /><span className={cn("text-xs tabular-nums", x.health < 50 && "text-danger")}>{x.health}</span></div></TableCell>
                <TableCell className="text-right tabular-nums">{idr(x.revenue)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={8}><EmptyState title="No accounts found" desc="Try another keyword or tier." action={<Button variant="outline" size="sm" onClick={() => { setQ(""); setTier("all") }}>Clear filters</Button>} /></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!a} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {a && (
            <>
              <SheetHeader>
                <SheetTitle>{a.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-1"><MapPin className="size-3.5" />{a.city} · {a.industry} · customer since {fmtDate(a.since)}</SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto px-4 pb-6">
                <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">Revenue</div><div className="font-semibold">{idrShort(a.revenue)}</div></div>
                  <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">Health</div><div className="font-semibold">{a.health}/100</div></div>
                  <div className="rounded-lg bg-muted/60 p-3"><div className="text-xs text-muted-foreground">Deals</div><div className="font-semibold">{accDeals.length}</div></div>
                </div>
                <Tabs defaultValue="contacts">
                  <TabsList className="w-full"><TabsTrigger value="contacts">Contacts</TabsTrigger><TabsTrigger value="deals">Deals</TabsTrigger><TabsTrigger value="finance">Finance</TabsTrigger></TabsList>
                  <TabsContent value="contacts" className="mt-3 space-y-2">
                    {contacts.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                        <Avatar><AvatarFallback className="bg-secondary ring-1 ring-border">{initials(c.name)}</AvatarFallback></Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{c.name} {c.primary && <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">Primary</span>}</div>
                          <div className="text-xs text-muted-foreground">{c.title}</div>
                          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Mail className="size-3" />{c.email}</span><span className="flex items-center gap-1"><Phone className="size-3" />{c.phone}</span></div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => toast.info("Add contact (mock)")}><Plus />Add contact</Button>
                  </TabsContent>
                  <TabsContent value="deals" className="mt-3 space-y-2">
                    {accDeals.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No deals yet.</p>}
                    {accDeals.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div><div className="font-medium">{d.title}</div><div className="text-xs text-muted-foreground">Close {fmtDate(d.closeDate)}</div></div>
                        <div className="text-right"><div className="tabular-nums">{idrShort(d.value)}</div><StatusBadge value={d.stage} /></div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="finance" className="mt-3 space-y-4 text-sm">
                    <div className="space-y-1.5 rounded-lg border p-3">
                      <div className="flex justify-between"><span className="text-muted-foreground">Credit limit</span><span className="font-medium">{idr(credit)}</span></div>
                      <Progress value={Math.min((used / credit) * 100, 100)} />
                      <div className="flex justify-between text-xs text-muted-foreground"><span>Used {idrShort(used)}</span><span>Available {idrShort(Math.max(credit - used, 0))}</span></div>
                    </div>
                    <Field label="Default payment term">
                      <SimpleSelect className="w-full" value={termOverride[a.id] ?? defaultTerm} onChange={(v) => { setTermOverride({ ...termOverride, [a.id]: v }); toast.success("Default payment term updated") }} options={paymentTerms.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))} />
                    </Field>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Invoices</div>
                      {accInv.length === 0 && <p className="text-muted-foreground">No invoices yet.</p>}
                      {accInv.map((v) => (
                        <div key={v.id} className="flex items-center justify-between rounded-lg border p-3"><div><div className="font-mono text-xs">{v.id}</div><div className="text-xs text-muted-foreground">{fmtDate(v.issued)}</div></div><div className="text-right"><div className="tabular-nums">{idrShort(v.total)}</div><StatusBadge value={v.status} /></div></div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
