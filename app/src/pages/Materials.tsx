import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, BellRing, CheckCircle2, Clock, Download, Eye, FileSpreadsheet, FileText, FileVideo, Folder, Image, Presentation, Search, Share2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EmptyState, Field, FormError, PageHeader, RepCell, SimpleSelect, StatCard, StatusBadge } from "@/components/common/bits"
import { addMaterial, updateMaterial, useApp } from "@/data/store"
import { effectiveStatus, folders, type EffectiveStatus, type FileFormat, type Folder as FolderT, type Material } from "@/data/enablement"
import { ME, openStages, repName, sellers, type Stage } from "@/data/sales"
import { TODAY, daysAgo, fmtDate, isValidDate, plural, relDays } from "@/lib/format"
import { cn } from "@/lib/utils"

const formatIcon: Record<FileFormat, typeof FileText> = { PDF: FileText, PPTX: Presentation, MP4: FileVideo, DOCX: FileText, XLSX: FileSpreadsheet, PNG: Image }
const EXPIRING_DAYS = 14
const activeReps = sellers.filter((r) => r.status === "Active")

type Scope = "all" | FolderT | "must-read" | "expiring"

export default function Materials() {
  const { materials } = useApp()
  const [scope, setScope] = useState<Scope>("all")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<EffectiveStatus | "all">("all")
  const [stage, setStage] = useState<Stage | "all">("all")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const withStatus = useMemo(() => materials.map((m) => ({ ...m, eff: effectiveStatus(m), daysLeft: m.expires ? -(daysAgo(m.expires) ?? 0) : null })), [materials])
  const isExpiring = (m: (typeof withStatus)[number]) => m.eff === "Expired" || (m.eff === "Published" && m.daysLeft !== null && m.daysLeft <= EXPIRING_DAYS)
  const list = withStatus.filter((m) =>
    (scope === "all" ? m.eff !== "Archived" : scope === "must-read" ? m.required && m.eff !== "Archived" : scope === "expiring" ? isExpiring(m) : m.folder === scope) &&
    (status === "all" || m.eff === status) && (stage === "all" || m.stages.includes(stage)) &&
    (!q.trim() || `${m.title} ${m.desc}`.toLowerCase().includes(q.trim().toLowerCase())))

  const mustRead = withStatus.filter((m) => m.required && m.eff === "Published")
  const ackRate = mustRead.length ? Math.round((mustRead.reduce((s, m) => s + activeReps.filter((r) => m.acknowledged.includes(r.id)).length, 0) / (mustRead.length * activeReps.length)) * 100) : 100
  const detail = withStatus.find((m) => m.id === detailId) ?? null

  return (
    <>
      <PageHeader title="Materials" desc="One approved source for decks, brochures, price lists and training — versioned, reviewed and tracked.">
        <Button onClick={() => setUploading(true)}><Upload />Upload material</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Published" value={withStatus.filter((m) => m.eff === "Published").length} hint="visible to reps" icon={<CheckCircle2 className="size-4" />} tone="success" />
        <StatCard label="Waiting for review" value={withStatus.filter((m) => m.eff === "In review").length} hint="needs an approver" icon={<Clock className="size-4" />} tone="warning" />
        <StatCard label="Expired or expiring" value={withStatus.filter(isExpiring).length} hint={`within ${EXPIRING_DAYS} days`} icon={<AlertTriangle className="size-4" />} tone="danger" />
        <StatCard label="Must-read completion" value={`${ackRate}%`} hint={`${mustRead.length} required items · ${activeReps.length} active reps`} icon={<BellRing className="size-4" />} tone="primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Folders" className="flex gap-1 overflow-x-auto lg:flex-col">
          {([["all", "All materials"], ["must-read", "Must-read"], ["expiring", "Expiring / expired"]] as const).map(([k, l]) => (
            <FolderButton key={k} active={scope === k} onClick={() => setScope(k)} label={l} count={k === "all" ? withStatus.filter((m) => m.eff !== "Archived").length : k === "must-read" ? withStatus.filter((m) => m.required && m.eff !== "Archived").length : withStatus.filter(isExpiring).length} />
          ))}
          <Separator className="my-1 max-lg:hidden" />
          {folders.map((f) => <FolderButton key={f} active={scope === f} onClick={() => setScope(f)} label={f} count={withStatus.filter((m) => m.folder === f).length} icon />)}
        </nav>

        <div className="min-w-0 space-y-3">
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <div className="relative sm:w-64"><Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search materials…" className="w-full pl-8" /></div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <SimpleSelect ariaLabel="Status" className="w-full min-w-0 sm:w-40" value={status} onChange={(v) => setStatus(v as EffectiveStatus | "all")} options={[{ value: "all", label: "Any status" }, ...(["Draft", "In review", "Published", "Expired", "Archived"] as const).map((s) => ({ value: s, label: s }))]} />
              <SimpleSelect ariaLabel="Pipeline stage" className="w-full min-w-0 sm:w-44" value={stage} onChange={(v) => setStage(v as Stage | "all")} options={[{ value: "all", label: "Any stage" }, ...openStages.map((s) => ({ value: s, label: `For ${s}` }))]} />
            </div>
          </div>

          {list.length === 0 ? (
            <Card><EmptyState title="No materials here" desc={q ? `Nothing matches “${q}”.` : "Upload a file or choose another folder."} action={<Button variant="outline" size="sm" onClick={() => setUploading(true)}><Upload />Upload</Button>} /></Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {list.map((m) => {
                const I = formatIcon[m.format]
                const acked = activeReps.filter((r) => m.acknowledged.includes(r.id)).length
                return (
                  <button key={m.id} onClick={() => setDetailId(m.id)} className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground/70"><I className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.folder} · {m.format} · v{m.version} · {m.size}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <StatusBadge value={m.eff} />
                      {m.required && <Badge variant="outline" className="border-primary/30 text-primary">Must-read</Badge>}
                      {m.eff === "Published" && m.daysLeft !== null && m.daysLeft <= EXPIRING_DAYS && <Badge variant="outline" className="border-warning/50">Expires in {m.daysLeft}d</Badge>}
                    </div>
                    {m.required && m.eff === "Published" && (
                      <div className="mt-3 space-y-1"><div className="flex justify-between text-xs text-muted-foreground"><span>Acknowledged</span><span>{acked}/{activeReps.length}</span></div><Progress value={(acked / activeReps.length) * 100} className="h-1" /></div>
                    )}
                    <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="size-3.5" />{m.views.toLocaleString("en-US")}</span>
                      <span className="flex items-center gap-1"><Download className="size-3.5" />{m.downloads}</span>
                      <span className="flex items-center gap-1"><Share2 className="size-3.5" />{m.shares.length}</span>
                      <span className="ml-auto">{relDays(m.updated)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {detail && <MaterialSheet m={detail} onClose={() => setDetailId(null)} />}
      <UploadDialog open={uploading} onOpenChange={setUploading} existing={materials} />
    </>
  )
}

function FolderButton({ active, onClick, label, count, icon }: { active: boolean; onClick: () => void; label: string; count: number; icon?: boolean }) {
  return (
    <button onClick={onClick} aria-current={active ? "true" : undefined} className={cn("flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap transition-colors", active ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
      {icon && <Folder className="size-3.5 shrink-0 opacity-70" />}<span className="flex-1">{label}</span><span className={cn("text-xs", active ? "opacity-80" : "text-muted-foreground")}>{count}</span>
    </button>
  )
}

function MaterialSheet({ m, onClose }: { m: Material & { eff: EffectiveStatus; daysLeft: number | null }; onClose: () => void }) {
  const { leads } = useApp()
  const [note, setNote] = useState("")
  const [newExpiry, setNewExpiry] = useState("")
  const [error, setError] = useState("")
  const acked = activeReps.filter((r) => m.acknowledged.includes(r.id))
  const pending = activeReps.filter((r) => !m.acknowledged.includes(r.id))

  const transition = (patch: Partial<Material>, msg: string) => { updateMaterial(m.id, { ...patch, updated: TODAY }); toast.success(msg) }
  const newVersion = () => {
    if (note.trim().length < 5) return setError("Describe what changed in this version (min. 5 characters).")
    updateMaterial(m.id, (x) => ({ version: x.version + 1, versions: [{ v: x.version + 1, at: TODAY, by: ME, note: note.trim() }, ...x.versions], status: "In review", updated: TODAY, acknowledged: x.required ? [] : x.acknowledged }))
    toast.success(`v${m.version + 1} uploaded — sent for review`, { description: m.required ? "Must-read acknowledgements were reset for the new version." : undefined })
    setNote(""); setError("")
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader><SheetTitle>{m.title}</SheetTitle><SheetDescription>{m.folder} · {m.format} · v{m.version} · {m.size}</SheetDescription></SheetHeader>
        <div className="space-y-5 overflow-y-auto px-4 pb-6 text-sm">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge value={m.eff} />{m.required && <Badge variant="outline" className="border-primary/30 text-primary">Must-read</Badge>}</div>
          <p>{m.desc}</p>

          {/* Review workflow */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="text-xs font-medium text-muted-foreground">Workflow</div>
            <ol className="flex items-center gap-1 text-xs">
              {(["Draft", "In review", "Published"] as const).map((s, i) => {
                const reached = ["Draft", "In review", "Published"].indexOf(m.status) >= i && m.status !== "Archived"
                return <li key={s} className="flex items-center gap-1">{i > 0 && <span className="h-px w-4 bg-border" />}<span className={cn("rounded-full px-2 py-0.5", reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{s}</span></li>
              })}
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              {m.status === "Draft" && <Button size="sm" onClick={() => transition({ status: "In review" }, "Submitted for review")}>Submit for review</Button>}
              {m.status === "In review" && <>
                <Button size="sm" disabled={m.eff === "Expired" || (!!m.expires && m.expires < TODAY)} onClick={() => transition({ status: "Published" }, "Published — reps can see it now")}>Approve & publish</Button>
                <Button size="sm" variant="outline" onClick={() => transition({ status: "Draft" }, "Sent back to draft")}>Request changes</Button>
              </>}
              {m.status === "Published" && <Button size="sm" variant="outline" onClick={() => transition({ status: "Archived" }, "Archived — hidden from reps")}>Archive</Button>}
              {m.status === "Archived" && <Button size="sm" variant="outline" onClick={() => transition({ status: "Draft" }, "Restored as draft")}>Restore</Button>}
            </div>
            {m.eff === "Expired" && (
              <div className="space-y-2 rounded-md bg-danger/10 p-2.5">
                <p className="text-danger">Expired on {fmtDate(m.expires)} — reps can no longer share it.</p>
                <div className="flex gap-2"><Input type="date" min={TODAY} value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} aria-label="New expiry date" />
                  <Button size="sm" disabled={!newExpiry || newExpiry <= TODAY} onClick={() => { transition({ expires: newExpiry }, `Expiry extended to ${fmtDate(newExpiry)}`); setNewExpiry("") }}>Extend</Button></div>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div><dt className="text-xs text-muted-foreground">Owner</dt><dd><RepCell id={m.owner} /></dd></div>
            <div><dt className="text-xs text-muted-foreground">Expires</dt><dd className={cn(m.daysLeft !== null && m.daysLeft <= EXPIRING_DAYS && "text-danger")}>{m.expires ? `${fmtDate(m.expires)}${m.daysLeft !== null && m.daysLeft >= 0 ? ` (${m.daysLeft}d)` : ""}` : "No expiry"}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-muted-foreground">Use in stages</dt><dd className="mt-1 flex flex-wrap gap-1">{m.stages.length ? m.stages.map((s) => <Badge key={s} variant="secondary">{s}</Badge>) : <span className="text-muted-foreground">Any stage</span>}</dd></div>
            {m.industries.length > 0 && <div className="col-span-2"><dt className="text-xs text-muted-foreground">Industries</dt><dd className="mt-1 flex flex-wrap gap-1">{m.industries.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</dd></div>}
          </dl>

          <div className="space-y-2 rounded-lg border p-3">
            <label className="flex items-center justify-between gap-3"><span><span className="font-medium">Must-read for reps</span><span className="block text-xs text-muted-foreground">Reps must confirm they've read the current version.</span></span>
              <Switch checked={m.required} onCheckedChange={(c) => { updateMaterial(m.id, { required: c }); toast(c ? "Marked as must-read" : "No longer must-read") }} /></label>
            {m.required && (
              <>
                <Progress value={(acked.length / activeReps.length) * 100} className="h-1.5" />
                <div className="text-xs text-muted-foreground">{acked.length} of {activeReps.length} active reps confirmed</div>
                {pending.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs">Pending: {pending.map((r) => r.name.split(" ")[0]).join(", ")}</span>
                    <Button size="xs" variant="outline" disabled={m.eff !== "Published"} onClick={() => toast.success(`Reminder sent to ${plural(pending.length, "rep")}`)}><BellRing />Remind</Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Versions</div>
            {m.versions.map((v) => <div key={v.v} className="flex gap-3 text-xs"><span className="w-7 shrink-0 font-medium">v{v.v}</span><span className="min-w-0 flex-1">{v.note}<span className="block text-muted-foreground">{fmtDate(v.at)} · {repName(v.by)}</span></span></div>)}
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <Field label={`Upload v${m.version + 1}`} hint="The new version goes to review before reps see it."><Textarea rows={2} value={note} maxLength={200} onChange={(e) => { setNote(e.target.value); setError("") }} placeholder="What changed?" /></Field>
              <FormError>{error}</FormError>
              <Button size="sm" variant="outline" disabled={m.status === "Archived"} onClick={newVersion}><Upload />Upload new version</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Shared with leads ({m.shares.length})</div>
            {m.shares.length === 0 && <p className="text-muted-foreground">Not shared yet. Share from a lead's page.</p>}
            {m.shares.map((s, i) => { const l = leads.find((x) => x.id === s.leadId); return <Link key={i} to={`/leads/${s.leadId}`} className="flex justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted"><span className="truncate">{l?.name ?? s.leadId} · {l?.company}</span><span className="text-xs text-muted-foreground">{repName(s.by).split(" ")[0]} · {relDays(s.at)}</span></Link> })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function UploadDialog({ open, onOpenChange, existing }: { open: boolean; onOpenChange: (o: boolean) => void; existing: Material[] }) {
  const [folder, setFolder] = useState<FolderT>("Pitch decks")
  const [format, setFormat] = useState<FileFormat>("PDF")
  const [stagesSel, setStagesSel] = useState<Stage[]>([])
  const [required, setRequired] = useState(false)
  const [file, setFile] = useState("")
  const [error, setError] = useState("")
  useEffect(() => { if (open) { setFolder("Pitch decks"); setFormat("PDF"); setStagesSel([]); setRequired(false); setFile(""); setError("") } }, [open])

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const title = String(f.get("title") ?? "").trim(), desc = String(f.get("desc") ?? "").trim(), expires = String(f.get("expires") ?? "")
    if (!file) return setError("Choose a file to upload.")
    if (!title) return setError("Title is required.")
    if (existing.some((m) => m.folder === folder && m.title.toLowerCase() === title.toLowerCase() && m.status !== "Archived")) return setError(`“${title}” already exists in ${folder}. Upload a new version from that material instead.`)
    if (expires && (!isValidDate(expires) || expires <= TODAY)) return setError("Expiry date must be in the future.")
    addMaterial({ title, desc, folder, format, status: "Draft", version: 1, versions: [{ v: 1, at: TODAY, by: ME, note: "Initial upload" }], owner: ME, updated: TODAY, expires: expires || null, stages: stagesSel, industries: [], required, acknowledged: [], views: 0, downloads: 0, shares: [], size: "1.0 MB" })
    toast.success(`“${title}” uploaded as draft`, { description: "Submit it for review to publish." }); onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Upload material</DialogTitle><DialogDescription>New uploads start as drafts and need review before reps can see them.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <label className="grid cursor-pointer place-items-center gap-1 rounded-lg border-2 border-dashed p-5 text-center text-sm text-muted-foreground hover:bg-muted/40">
            <Upload className="size-5" />{file ? <span className="font-medium text-foreground">{file}</span> : <span><b className="text-foreground">Choose a file</b> · PDF, PPTX, DOCX, XLSX, MP4 · max 100 MB</span>}
            <input type="file" className="sr-only" accept=".pdf,.pptx,.docx,.xlsx,.mp4,.png" onChange={(e) => {
              const fl = e.target.files?.[0]; if (!fl) return
              if (fl.size > 100 * 1024 * 1024) { setError("File is larger than 100 MB."); return }
              const ext = fl.name.split(".").pop()?.toUpperCase() as FileFormat
              if (ext && formatIcon[ext]) setFormat(ext)
              setFile(fl.name); setError("")
            }} />
          </label>
          <Field label="Title"><Input name="title" required maxLength={80} /></Field>
          <Field label="Description"><Textarea name="desc" rows={2} maxLength={300} placeholder="When should a rep use this?" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Folder"><SimpleSelect className="w-full" value={folder} onChange={(v) => setFolder(v as FolderT)} options={folders.map((x) => ({ value: x, label: x }))} /></Field>
            <Field label="Expiry date" hint="Optional — e.g. for price lists."><Input name="expires" type="date" min={TODAY} /></Field>
          </div>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Recommend in stages</span>
            <div className="flex flex-wrap gap-1.5">
              {openStages.map((s) => {
                const on = stagesSel.includes(s)
                return <button key={s} type="button" aria-pressed={on} onClick={() => setStagesSel(on ? stagesSel.filter((x) => x !== s) : [...stagesSel, s])} className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{s}</button>
              })}
            </div>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span><span className="font-medium">Must-read</span><span className="block text-xs text-muted-foreground">Reps will be asked to confirm they've read it.</span></span><Switch checked={required} onCheckedChange={setRequired} /></label>
          <FormError>{error}</FormError>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Upload as draft</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
