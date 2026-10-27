import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Callout, Field, FormError, PageHeader, PaceBadge, RepCell, SimpleSelect, StatusBadge } from "@/components/common/bits"
import { useApp } from "@/data/store"
import { reps as seed, repName, type Rep, type Role } from "@/data/sales"
import { areaById, areas } from "@/data/geo"
import { CURRENT_MONTH, actuals, elapsed, paceOf } from "@/data/targets"
import { TODAY, idrShort, nextId, ratio } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function Team() {
  const { leads, deals, targets } = useApp()
  const [rows, setRows] = useState<Rep[]>(seed)
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>("Sales Rep")
  const [sel, setSel] = useState<string[]>([])
  const [error, setError] = useState("")
  const share = elapsed([CURRENT_MONTH])

  const invite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    const name = String(f.get("name") ?? "").trim(), email = String(f.get("email") ?? "").trim().toLowerCase()
    if (!name) return setError("Name is required.")
    if (rows.some((r) => r.email.toLowerCase() === email)) return setError(`${email} is already on the team.`)
    if (role !== "Admin" && sel.length === 0) return setError("Assign at least one territory, otherwise new leads can't be routed to this rep.")
    setRows([...rows, { id: nextId("r", rows.map((r) => r.id)), name, email, phone: "-", role, areas: sel, status: "Active", joined: TODAY }])
    setOpen(false); toast.success(`Invitation sent to ${email} (mock)`)
  }

  return (
    <>
      <PageHeader title="Team" desc="Members, roles, territories and current workload.">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setRole("Sales Rep"); setSel([]); setError("") } }}>
          <DialogTrigger render={<Button />}><Plus />Invite member</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite a team member</DialogTitle><DialogDescription>They'll get an email to set a password.</DialogDescription></DialogHeader>
            <form onSubmit={invite} className="grid gap-3">
              <Field label="Full name"><Input name="name" required maxLength={80} onChange={() => setError("")} /></Field>
              <Field label="Work email"><Input name="email" type="email" required onChange={() => setError("")} /></Field>
              <Field label="Role"><SimpleSelect className="w-full" value={role} onChange={(v) => setRole(v as Role)} options={(["Sales Rep", "Senior AE", "Sales Manager", "Admin"] as Role[]).map((r) => ({ value: r, label: r }))} /></Field>
              {role !== "Admin" && (
                <div className="grid gap-1.5">
                  <span className="text-sm font-medium">Territories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {areas.map((a) => { const on = sel.includes(a.id); return <button key={a.id} type="button" aria-pressed={on} onClick={() => { setSel(on ? sel.filter((x) => x !== a.id) : [...sel, a.id]); setError("") }} className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{a.name}</button> })}
                  </div>
                </div>
              )}
              <FormError>{error}</FormError>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Send invite</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Callout title="Roles decide access">A role controls what a person can see (Settings → Roles & access) and what they can carry to their phone (Data & Access). Territories decide which new leads are routed to them.</Callout>
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Territories</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Open leads</TableHead><TableHead className="text-right">Open deals</TableHead><TableHead className="w-52">October target</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => {
              const t = targets[r.id]?.[CURRENT_MONTH] ?? 0, c = actuals[r.id]?.[CURRENT_MONTH] ?? 0, p = ratio(c, t)
              const ol = leads.filter((l) => l.owner === r.id && l.status !== "Converted" && l.status !== "Unqualified").length
              const od = deals.filter((d) => d.owner === r.id && d.stage !== "Closed Won" && d.stage !== "Closed Lost").length
              return (
                <TableRow key={r.id}>
                  <TableCell><RepCell id={r.id} size="default" sub={r.email} />{!seed.some((x) => x.id === r.id) && <div className="pl-10 text-xs font-medium text-brand-2">Invitation pending</div>}</TableCell>
                  <TableCell><div>{r.role}</div>{r.managerId && <div className="text-xs text-muted-foreground">reports to {repName(r.managerId).split(" ")[0]}</div>}</TableCell>
                  <TableCell><div className="flex max-w-56 flex-wrap gap-1">{r.areas.length ? r.areas.map((a) => <Badge key={a} variant="secondary">{areaById(a)?.short}</Badge>) : <span className="text-muted-foreground">—</span>}</div></TableCell>
                  <TableCell><StatusBadge value={r.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{r.role === "Admin" ? "—" : <Link className="hover:underline" to={`/leads?owner=${r.id}`}>{ol}</Link>}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.role === "Admin" ? "—" : od}</TableCell>
                  <TableCell>{t ? <div className="space-y-1"><div className="flex items-center justify-between gap-2 text-xs"><span>{idrShort(c)} / {idrShort(t)}</span><PaceBadge pace={paceOf(c, t, share)} /></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(p, 100)}%` }} /></div></div> : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
