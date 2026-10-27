import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Field, FormError, GradeBadge, PageHeader } from "@/components/common/bits"
import { setCheckpoints, setQuality, useApp } from "@/data/store"
import { defaultCheckpoints, defaultQualityRules, gradeOf, grades, openStages, repName, stageProb, type Checkpoint, type OpenStage, type QualityRules } from "@/data/sales"
import { auditLog, integrations as seedInt, permissionMatrix, permissionModules, roles } from "@/data/mock"
import { clamp } from "@/lib/format"
import { cn } from "@/lib/utils"

const lvl: Record<string, string> = { A: "All", T: "Team", O: "Own", "-": "No access" }
const lvlCls: Record<string, string> = { A: "bg-primary/10 text-primary", T: "bg-brand-2/12 text-brand-2", O: "bg-muted text-foreground", "-": "text-muted-foreground" }

export default function SettingsPage() {
  const [ints, setInts] = useState(seedInt)
  const [perm, setPerm] = useState(permissionMatrix)
  const cycle = (role: (typeof roles)[number], i: number) => {
    if (role === "Admin") return toast.error("Admin access can't be reduced", { description: "Otherwise nobody could manage settings." })
    const order = ["-", "O", "T", "A"]; const next = order[(order.indexOf(perm[role][i]) + 1) % 4]
    setPerm({ ...perm, [role]: perm[role].map((v, x) => (x === i ? next : v)) })
  }
  return (
    <>
      <PageHeader title="Settings" desc="Company defaults, pipeline rules, lead quality, access and integrations." />
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="pipeline">Pipeline checkpoints</TabsTrigger>
          <TabsTrigger value="quality">Lead quality</TabsTrigger><TabsTrigger value="access">Roles & access</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger><TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="max-w-2xl"><CardHeader><CardTitle>Company profile</CardTitle><CardDescription>Used on quotes, invoices and emails.</CardDescription></CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Company name"><Input defaultValue="PT Bluesilo Digital Indonesia" /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Currency"><Input defaultValue="IDR — Indonesian Rupiah" readOnly /></Field><Field label="Default VAT (%)"><Input type="number" min={0} max={100} defaultValue={11} /></Field></div>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Quote validity (days)"><Input type="number" min={1} defaultValue={30} /></Field><Field label="Max discount without approval (%)"><Input type="number" min={0} max={100} defaultValue={10} /></Field></div>
              <div><Button onClick={() => toast.success("Settings saved (mock)")}>Save</Button></div>
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4"><CheckpointEditor /></TabsContent>
        <TabsContent value="quality" className="mt-4"><QualityEditor /></TabsContent>

        <TabsContent value="access" className="mt-4">
          <Card className="overflow-hidden"><CardHeader><CardTitle>Access matrix</CardTitle><CardDescription>Click a cell to change data scope: No access → Own → Team → All. Admin is fixed.</CardDescription></CardHeader>
            <CardContent className="px-0">
              <Table><TableHeader><TableRow><TableHead>Module</TableHead>{roles.map((r) => <TableHead key={r}>{r}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{permissionModules.map((m, i) => (
                  <TableRow key={m}><TableCell className="font-medium">{m}</TableCell>
                    {roles.map((r) => <TableCell key={r}><button onClick={() => cycle(r, i)} aria-label={`${m} for ${r}: ${lvl[perm[r][i]]}`} className={cn("rounded-md px-2 py-1 text-xs font-medium transition-colors hover:ring-1 hover:ring-border", lvlCls[perm[r][i]], r === "Admin" && "cursor-not-allowed")}>{lvl[perm[r][i]]}</button></TableCell>)}
                  </TableRow>))}</TableBody></Table>
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 grid max-w-3xl gap-3">
          {ints.map((i) => (
            <Card key={i.id} size="sm"><CardContent className="flex items-center gap-4">
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2 font-medium">{i.name}{i.on && <Badge variant="outline" className="border-success/40 text-success">Connected</Badge>}</div><div className="text-sm text-muted-foreground">{i.desc}</div></div>
              <Switch checked={i.on} onCheckedChange={(c) => { setInts(ints.map((x) => x.id === i.id ? { ...x, on: c } : x)); toast.success(`${i.name} ${c ? "connected" : "disconnected"}`) }} aria-label={i.name} />
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="overflow-hidden py-0"><Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Object</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
            <TableBody>{auditLog.map((l) => <TableRow key={l.id}><TableCell className="font-mono text-xs">{l.time}</TableCell><TableCell>{repName(l.who)}</TableCell><TableCell>{l.action}</TableCell><TableCell className="text-muted-foreground">{l.target}</TableCell><TableCell className="font-mono text-xs">{l.ip}</TableCell></TableRow>)}</TableBody></Table></Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

function CheckpointEditor() {
  const { checkpoints, deals } = useApp()
  const [stage, setStage] = useState<OpenStage>("Prospecting")
  const [draft, setDraft] = useState<Checkpoint[]>(checkpoints[stage])
  const [error, setError] = useState("")
  useEffect(() => { setDraft(checkpoints[stage]); setError("") }, [stage, checkpoints])

  const dirty = JSON.stringify(draft) !== JSON.stringify(checkpoints[stage])
  const inStage = deals.filter((d) => d.stage === stage).length
  const patch = (i: number, p: Partial<Checkpoint>) => setDraft(draft.map((c, k) => (k === i ? { ...c, ...p } : c)))
  const move = (i: number, dir: -1 | 1) => { const n = [...draft]; const j = i + dir; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setDraft(n) }

  const save = () => {
    const labels = draft.map((c) => c.label.trim().toLowerCase())
    if (draft.some((c) => !c.label.trim())) return setError("Every checkpoint needs a label.")
    if (new Set(labels).size !== labels.length) return setError("Two checkpoints have the same label.")
    if (!draft.some((c) => c.required)) return setError(`${stage} needs at least one required checkpoint, otherwise deals can skip it without any proof.`)
    setCheckpoints(stage, draft.map((c) => ({ ...c, label: c.label.trim(), hint: c.hint.trim() })))
    toast.success(`${stage} checkpoints saved`, { description: inStage ? `${inStage} deals in this stage are re-evaluated immediately.` : undefined })
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Stages" className="flex gap-1 overflow-x-auto lg:flex-col">
        {openStages.map((s) => (
          <button key={s} onClick={() => setStage(s)} aria-current={stage === s ? "true" : undefined} className={cn("flex shrink-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm", stage === s ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
            {s}<span className={cn("text-xs", stage === s ? "opacity-80" : "text-muted-foreground")}>{checkpoints[s].filter((c) => c.required).length} req.</span>
          </button>
        ))}
      </nav>
      <Card>
        <CardHeader>
          <CardTitle>Exit criteria · {stage}</CardTitle>
          <CardDescription>A deal can only leave <b>{stage}</b> ({stageProb[stage]}% probability) when every required item is ticked. {inStage} deals are in this stage now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.map((c, i) => (
            <div key={c.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="grid gap-2">
                <Input value={c.label} maxLength={60} onChange={(e) => { patch(i, { label: e.target.value }); setError("") }} placeholder="Checkpoint label" aria-label="Checkpoint label" />
                <Input value={c.hint} maxLength={120} onChange={(e) => patch(i, { hint: e.target.value })} placeholder="Hint for reps: what counts as done?" aria-label="Hint" className="text-sm" />
              </div>
              <div className="flex items-center gap-1 sm:flex-col sm:items-end">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={c.required} onCheckedChange={(v) => { patch(i, { required: !!v }); setError("") }} />Required</label>
                <div className="ml-auto flex gap-0.5 sm:ml-0">
                  <Button size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp /></Button>
                  <Button size="icon-sm" variant="ghost" disabled={i === draft.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown /></Button>
                  <Button size="icon-sm" variant="ghost" disabled={draft.length === 1} onClick={() => setDraft(draft.filter((_, k) => k !== i))} aria-label="Delete checkpoint"><Trash2 /></Button>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" disabled={draft.length >= 8} onClick={() => setDraft([...draft, { id: `${stage[0].toLowerCase()}${Date.now()}`, label: "", hint: "", required: true }])}><Plus />Add checkpoint</Button>
          {draft.length >= 8 && <p className="text-xs text-muted-foreground">Keep it to 8 or fewer — long checklists get ticked without reading.</p>}
          <FormError>{error}</FormError>
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button disabled={!dirty} onClick={save}>Save {stage}</Button>
            <Button variant="outline" disabled={!dirty} onClick={() => setDraft(checkpoints[stage])}>Discard</Button>
            <Button variant="ghost" onClick={() => { setDraft(defaultCheckpoints[stage]); setError("") }}><RotateCcw />Reset to default</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QualityEditor() {
  const { quality, leads } = useApp()
  const [q, setQ] = useState<QualityRules>(quality)
  const [error, setError] = useState("")
  useEffect(() => setQ(quality), [quality])
  const preview = Object.fromEntries(grades.map((g) => [g, leads.filter((l) => gradeOf(l.score, l.fit, q) === g).length]))
  const current = Object.fromEntries(grades.map((g) => [g, leads.filter((l) => gradeOf(l.score, l.fit, quality) === g).length]))
  const dirty = JSON.stringify(q) !== JSON.stringify(quality)

  const save = () => {
    if (!(q.aMin > q.bMin && q.bMin > q.cMin)) return setError("Thresholds must go down: A > B > C.")
    if (q.cMin < 0 || q.aMin > 110) return setError("Thresholds must be between 0 and 110 (score + fit bonus).")
    if (!(q.sla.A <= q.sla.B && q.sla.B <= q.sla.C && q.sla.C <= q.sla.D)) return setError("Better leads should be contacted at least as often: SLA A ≤ B ≤ C ≤ D.")
    if (grades.some((g) => q.sla[g] < 1)) return setError("SLA must be at least 1 day.")
    setQuality(q); toast.success("Lead quality rules saved", { description: "All leads were re-graded." })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Grading rules</CardTitle><CardDescription>Grade = engagement score + ICP fit bonus (strong +10, partial 0, weak −15).</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {([["aMin", "A"], ["bMin", "B"], ["cMin", "C"]] as const).map(([k, g]) => (
            <div key={k} className="flex items-center gap-3"><GradeBadge grade={g} className="w-24" /><span className="text-sm text-muted-foreground">from</span>
              <Input type="number" className="w-24" min={0} max={110} value={q[k]} onChange={(e) => { setQ({ ...q, [k]: clamp(e.target.value, 0, 110) }); setError("") }} aria-label={`Grade ${g} minimum`} /></div>
          ))}
          <div className="flex items-center gap-3"><GradeBadge grade="D" className="w-24" /><span className="text-sm text-muted-foreground">below {q.cMin}</span></div>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span><span className="font-medium">Grade A requires a strong ICP fit</span><span className="block text-xs text-muted-foreground">Highly engaged but poor-fit leads stop at B.</span></span><Switch checked={q.requireStrongFitForA} onCheckedChange={(c) => setQ({ ...q, requireStrongFitForA: c })} /></label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Follow-up SLA</CardTitle><CardDescription>Max days between real touches (visit, meeting, call, follow-up). Older = “Past SLA”.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {grades.map((g) => (
            <div key={g} className="flex items-center gap-3"><GradeBadge grade={g} className="w-24" /><span className="text-sm text-muted-foreground">every</span>
              <Input type="number" className="w-20" min={1} max={90} value={q.sla[g]} onChange={(e) => { setQ({ ...q, sla: { ...q.sla, [g]: clamp(e.target.value, 1, 90) } }); setError("") }} aria-label={`SLA grade ${g}`} /><span className="text-sm text-muted-foreground">days</span></div>
          ))}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Preview</CardTitle><CardDescription>How {leads.length} leads would be graded with these rules.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {grades.map((g) => (
              <div key={g} className="rounded-lg border p-3"><GradeBadge grade={g} /><div className="mt-2 text-2xl font-semibold tabular-nums">{preview[g]}</div>
                <div className={cn("text-xs", preview[g] === current[g] ? "text-muted-foreground" : "text-primary")}>{preview[g] === current[g] ? "no change" : `${preview[g] > current[g] ? "+" : ""}${preview[g] - current[g]} vs now`}</div></div>
            ))}
          </div>
          <FormError>{error}</FormError>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!dirty} onClick={save}>Save rules</Button>
            <Button variant="outline" disabled={!dirty} onClick={() => { setQ(quality); setError("") }}>Discard</Button>
            <Button variant="ghost" onClick={() => setQ(defaultQualityRules)}><RotateCcw />Reset to default</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
