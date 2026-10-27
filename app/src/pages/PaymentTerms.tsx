import { useState } from "react"
import { AlertTriangle, CheckCircle2, Copy, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Callout, Field, PageHeader, SimpleSelect } from "@/components/common/bits"
import { paymentTerms as seed, termTriggers, type PaymentTerm, type TermStep, type TermTrigger } from "@/data/finance"
import { clamp, idr } from "@/lib/format"
import { cn } from "@/lib/utils"

// Neutral ramp: primary → secondary → greys
const segColors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]
const tiers = ["Enterprise", "Mid-market", "SMB"]

export default function PaymentTerms() {
  const [terms, setTerms] = useState<PaymentTerm[]>(seed)
  const [selId, setSelId] = useState(seed[1].id)
  const [sample, setSample] = useState(100_000_000)
  const [reminders, setReminders] = useState({ d7: true, d1: true, plus3: true, plus14: false })
  const t = terms.find((x) => x.id === selId)!
  const total = t.steps.reduce((s, x) => s + x.pct, 0)
  const codeTaken = terms.some((x) => x.id !== t.id && x.code.trim().toUpperCase() === t.code.trim().toUpperCase())
  const errors = [
    total !== 100 && `Installments add up to ${total}% — must be exactly 100%.`,
    !t.name.trim() && "Name is required.",
    !t.code.trim() && "Code is required.",
    codeTaken && `Code “${t.code}” is already used by another term.`,
    t.steps.some((x) => x.pct <= 0) && "Every installment must be above 0%.",
    t.steps.some((x) => !x.label.trim()) && "Every installment needs a name.",
  ].filter(Boolean) as string[]
  const valid = total === 100

  const patch = (p: Partial<PaymentTerm>) => setTerms(terms.map((x) => (x.id === t.id ? { ...x, ...p } : x)))
  const patchStep = (i: number, p: Partial<TermStep>) => patch({ steps: t.steps.map((s, k) => (k === i ? { ...s, ...p } : s)) })
  const addTerm = (from?: PaymentTerm) => {
    const id = `pt${Date.now()}`
    const base: PaymentTerm = from
      ? { ...from, id, code: `${from.code}-COPY`.slice(0, 12), name: `${from.name} (copy)`, usage: 0, defaultFor: [] }
      : { id, code: "NEW", name: "New payment term", desc: "", steps: [{ label: "Full payment", pct: 100, trigger: "After invoice", days: 30 }], defaultFor: [], active: false, usage: 0, lateFee: 1, needsApproval: false }
    setTerms([...terms, base]); setSelId(id)
  }

  return (
    <>
      <PageHeader title="Payment Terms" desc="Payment schemes reps can choose when creating quotes and invoices.">
        <Button onClick={() => addTerm()}><Plus />New term</Button>
      </PageHeader>

      <Callout title="How payment terms work">
        A term has one or more <b>installments</b> (percentage + trigger + days). They must add up to 100%. A term can be the <b>default for a customer tier</b>; terms marked “needs approval” go to the Approvals queue before the invoice is sent.
      </Callout>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="grid h-fit gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
          {terms.map((x) => (
            <button key={x.id} onClick={() => setSelId(x.id)} className={cn("w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40", x.id === selId && "border-primary ring-2 ring-primary/15")}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{x.name}</span>
                {x.active ? <Badge variant="outline" className="border-success/40 text-success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
              </div>
              <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted">
                {x.steps.map((s, i) => <span key={i} className={segColors[i % 5]} style={{ width: `${s.pct}%` }} />)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{x.code}</span><span>{x.steps.length} installments · used {x.usage}×</span>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div><CardTitle>Term details</CardTitle><CardDescription>Changes apply to new invoices only.</CardDescription></div>
              <div className="flex items-center gap-2 text-sm">Active <Switch checked={t.active} onCheckedChange={(c) => patch({ active: c })} aria-label="Activate term" /></div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <Field label="Name"><Input value={t.name} maxLength={60} aria-invalid={!t.name.trim()} onChange={(e) => patch({ name: e.target.value })} /></Field>
                <Field label="Code"><Input value={t.code} onChange={(e) => patch({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12) })} aria-invalid={codeTaken || !t.code.trim()} className="font-mono" /></Field>
              </div>
              <Field label="Description (shown on quotes)"><Textarea rows={2} value={t.desc} onChange={(e) => patch({ desc: e.target.value })} /></Field>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Installments</span>
                  <span className={cn("flex items-center gap-1 text-xs font-medium", valid ? "text-success" : "text-danger")}>
                    {valid ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}Total {total}%{!valid && " — must be 100%"}
                  </span>
                </div>
                <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
                  {t.steps.map((s, i) => <span key={i} className={cn(segColors[i % 5], "transition-all")} style={{ width: `${Math.min(s.pct, 100)}%` }} />)}
                </div>
                {t.steps.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                    <span className={cn("size-2.5 shrink-0 rounded-full", segColors[i % 5])} />
                    <Input value={s.label} onChange={(e) => patchStep(i, { label: e.target.value })} placeholder="Installment name" aria-label="Installment name" className="min-w-36 flex-1" />
                    <div className="relative w-24"><Input type="number" min={0} max={100} value={s.pct} onChange={(e) => patchStep(i, { pct: clamp(e.target.value, 0, 100) })} className="pr-7" aria-label="Percentage" /><span className="absolute top-1.5 right-2.5 text-sm text-muted-foreground">%</span></div>
                    <SimpleSelect ariaLabel="Trigger" className="w-48" value={s.trigger} onChange={(v) => patchStep(i, { trigger: v as TermTrigger })} options={termTriggers.map((x) => ({ value: x, label: x }))} />
                    <div className="relative w-28"><Input type="number" min={0} value={s.days} onChange={(e) => patchStep(i, { days: clamp(e.target.value, 0, 365) })} className="pr-12" aria-label="Days after trigger" /><span className="absolute top-2 right-2.5 text-xs text-muted-foreground">+days</span></div>
                    <Button variant="ghost" size="icon-sm" disabled={t.steps.length === 1} onClick={() => patch({ steps: t.steps.filter((_, k) => k !== i) })} aria-label="Remove installment"><Trash2 /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => patch({ steps: [...t.steps, { label: `Installment ${t.steps.length + 1}`, pct: Math.max(0, 100 - total), trigger: "After invoice", days: 30 }] })}><Plus />Add installment</Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Late fee (% per month)"><Input type="number" step={0.5} min={0} value={t.lateFee} onChange={(e) => patch({ lateFee: clamp(e.target.value, 0, 10) })} /></Field>
                <div className="grid gap-1.5">
                  <span className="text-sm font-medium">Default for tier</span>
                  <div className="flex flex-wrap gap-3 pt-1.5">
                    {tiers.map((tier) => (
                      <label key={tier} className="flex items-center gap-1.5 text-sm">
                        <Checkbox checked={t.defaultFor.includes(tier)} onCheckedChange={(c) => patch({ defaultFor: c ? [...t.defaultFor, tier] : t.defaultFor.filter((x) => x !== tier) })} />{tier}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <span><span className="font-medium">Needs Finance approval</span><span className="block text-muted-foreground">Invoices with this term are held until approved.</span></span>
                <Switch checked={t.needsApproval} onCheckedChange={(c) => patch({ needsApproval: c })} />
              </label>
              {errors.length > 0 && (
                <ul role="alert" className="list-disc space-y-0.5 rounded-md bg-danger/10 py-2 pr-3 pl-7 text-sm text-danger">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
              )}
              {t.usage > 0 && <p className="text-xs text-muted-foreground">Used by {t.usage} invoices, so it can't be deleted. Deactivate it to stop new use.</p>}
              <div className="flex flex-wrap gap-2">
                <Button disabled={errors.length > 0} onClick={() => toast.success(`“${t.name}” saved`)}>Save term</Button>
                <Button variant="outline" onClick={() => addTerm(t)}><Copy />Duplicate</Button>
                {terms.length > 1 && (
                  <Button variant="destructive" disabled={t.usage > 0} title={t.usage > 0 ? `Used by ${t.usage} invoices — deactivate instead` : undefined}
                    onClick={() => { const rest = terms.filter((x) => x.id !== t.id); setTerms(rest); setSelId(rest[0].id); toast(`“${t.name}” deleted`) }}>Delete</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Simulation</CardTitle><CardDescription>Example schedule for a deal value</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <Input type="number" min={0} value={sample} onChange={(e) => setSample(clamp(e.target.value, 0))} aria-label="Example value" />
                {t.steps.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2"><span className={cn("size-2.5 shrink-0 rounded-full", segColors[i % 5])} /><span className="truncate">{s.label}</span><span className="shrink-0 text-xs text-muted-foreground">{s.trigger.toLowerCase()} +{s.days}d</span></span>
                    <span className="tabular-nums">{idr((sample * s.pct) / 100)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Automatic reminders</CardTitle><CardDescription>Apply to every term (email + WhatsApp)</CardDescription></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {([["d7", "7 days before due"], ["d1", "1 day before due"], ["plus3", "3 days overdue"], ["plus14", "14 days overdue — escalate to manager"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center justify-between gap-3">{l}<Switch checked={reminders[k]} onCheckedChange={(c) => setReminders({ ...reminders, [k]: c })} /></label>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
