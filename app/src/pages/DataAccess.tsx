import { useState } from "react"
import { FileSpreadsheet, Plus, Smartphone, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Callout, PageHeader, RepCell, StatusBadge } from "@/components/common/bits"
import { carryRules as seedRules, dataScopes, devices as seedDevices, masterData as seedMaster, sensitiveFields as seedFields, type CarryRule, type ScopeKey } from "@/data/division"
import { clamp } from "@/lib/format"
import { cn } from "@/lib/utils"

const carryRoles = Object.keys(seedRules)

export default function DataAccess() {
  const [role, setRole] = useState(carryRoles[0])
  const [rules, setRules] = useState(seedRules)
  const [fields, setFields] = useState(seedFields)
  const [policy, setPolicy] = useState({ watermark: true, wipe: true, pin: true, screenshot: false })
  const [master, setMaster] = useState(seedMaster)
  const [mKey, setMKey] = useState("source")
  const [newVal, setNewVal] = useState("")
  const [devices, setDevices] = useState(seedDevices)

  const setRule = (k: ScopeKey, p: Partial<CarryRule>) => setRules({ ...rules, [role]: { ...rules[role], [k]: { ...rules[role][k], ...p } } })
  const addValue = () => {
    const v = newVal.trim().replace(/\s+/g, " ")
    if (!v) return toast.error("Value can't be empty")
    if (master[mKey].values.some((x) => x.toLowerCase() === v.toLowerCase())) return toast.error(`“${v}” already exists in ${master[mKey].label.toLowerCase()}`)
    setMaster({ ...master, [mKey]: { ...master[mKey], values: [...master[mKey].values, v] } }); setNewVal("")
  }

  return (
    <>
      <PageHeader title="Data & Access" desc="Master data for every form, and what data reps are allowed to carry on their devices.">
        <Button onClick={() => toast.success("Data settings saved (mock)")}>Save changes</Button>
      </PageHeader>

      <Tabs defaultValue="carry">
        <TabsList>
          <TabsTrigger value="carry">What reps can carry</TabsTrigger><TabsTrigger value="master">Master data</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger><TabsTrigger value="import">Import / export</TabsTrigger>
        </TabsList>

        <TabsContent value="carry" className="mt-4 space-y-4">
          <Callout title="What does “carry” mean?">
            Which data syncs to a rep's phone so it opens <b>offline</b>, how long it stays on the device, and whether it can be <b>exported</b> (CSV/PDF). Anything not enabled is only viewable online.
          </Callout>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Role">
            {carryRoles.map((r) => (
              <button key={r} role="tab" aria-selected={r === role} onClick={() => setRole(r)} className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", r === role ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{r}</button>
            ))}
          </div>
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead className="text-center">Available offline</TableHead><TableHead>Keep on device</TableHead>
                <TableHead className="text-center">Can export</TableHead><TableHead>Max rows per export</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {dataScopes.map((s) => {
                  const r = rules[role][s.key]
                  return (
                    <TableRow key={s.key}>
                      <TableCell><div className="font-medium">{s.label}</div><div className="text-xs text-muted-foreground">{s.desc}</div></TableCell>
                      <TableCell className="text-center"><Switch checked={r.offline} onCheckedChange={(c) => setRule(s.key, { offline: c, days: c ? r.days || 14 : 0 })} aria-label={`Offline ${s.label}`} /></TableCell>
                      <TableCell>
                        <div className="relative w-28"><Input type="number" min={1} disabled={!r.offline} value={r.days} onChange={(e) => setRule(s.key, { days: clamp(e.target.value, 1, 365) })} className="h-8 pr-11" aria-label="Days" /><span className="absolute top-1.5 right-2 text-xs text-muted-foreground">days</span></div>
                      </TableCell>
                      <TableCell className="text-center"><Switch checked={r.export} onCheckedChange={(c) => setRule(s.key, { export: c })} aria-label={`Export ${s.label}`} /></TableCell>
                      <TableCell>
                        {s.key === "content" ? <span className="text-xs text-muted-foreground">file download</span> :
                          <Input type="number" min={0} disabled={!r.export} value={r.maxRows} onChange={(e) => setRule(s.key, { maxRows: clamp(e.target.value, 0, 100000) })} className="h-8 w-28" aria-label="Max rows" />}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Sensitive fields</CardTitle><CardDescription>Roles allowed to see each field (web and device)</CardDescription></CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Field</TableHead>{carryRoles.map((r) => <TableHead key={r} className="text-center text-xs">{r}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {fields.map((f) => (
                      <TableRow key={f.key}>
                        <TableCell className="text-sm">{f.label}</TableCell>
                        {carryRoles.map((r) => (
                          <TableCell key={r} className="text-center">
                            <Checkbox checked={f.roles.includes(r)} onCheckedChange={(c) => setFields(fields.map((x) => x.key === f.key ? { ...x, roles: c ? [...x.roles, r] : x.roles.filter((y) => y !== r) } : x))} aria-label={`${f.label} for ${r}`} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Device security</CardTitle><CardDescription>Applies to every role</CardDescription></CardHeader>
              <CardContent className="space-y-4 text-sm">
                {([
                  ["watermark", "Watermark name and time on exported files", "Discourages untraceable leaks."],
                  ["wipe", "Wipe device data when a user is deactivated", "Offline data is removed at the next sync."],
                  ["pin", "Require PIN / biometrics to open the app", "On open, and after 5 minutes idle."],
                  ["screenshot", "Block screenshots on pricing and invoice screens", "Android only."],
                ] as const).map(([k, l, d]) => (
                  <label key={k} className="flex items-start justify-between gap-4">
                    <span><span className="font-medium">{l}</span><span className="block text-muted-foreground">{d}</span></span>
                    <Switch checked={policy[k]} onCheckedChange={(c) => setPolicy({ ...policy, [k]: c })} />
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="master" className="mt-4 space-y-4">
          <Callout title="Master data">Option lists used by dropdowns across the app. Changes apply immediately to lead, account, product, quote and invoice forms.</Callout>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Card className="h-fit py-2"><CardContent className="space-y-1 px-2">
              {Object.entries(master).map(([k, m]) => (
                <button key={k} onClick={() => setMKey(k)} className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors", k === mKey ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                  {m.label}<span className={cn("text-xs", k === mKey ? "opacity-80" : "text-muted-foreground")}>{m.values.length}</span>
                </button>
              ))}
            </CardContent></Card>
            <Card>
              <CardHeader><CardTitle>{master[mKey].label}</CardTitle><CardDescription>{master[mKey].desc}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {master[mKey].values.map((v) => (
                    <span key={v} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-1 pr-1 pl-3 text-sm">
                      {v}
                      <button onClick={() => {
                        if (master[mKey].values.length <= 1) return toast.error("Keep at least one option", { description: "Forms using this list would be empty." })
                        const before = master
                        setMaster({ ...master, [mKey]: { ...master[mKey], values: master[mKey].values.filter((x) => x !== v) } })
                        toast(`“${v}” removed`, { description: "Existing records keep their value.", action: { label: "Undo", onClick: () => setMaster(before) } })
                      }} className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground" aria-label={`Remove ${v}`}><X className="size-3.5" /></button>
                    </span>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); addValue() }} className="flex max-w-md gap-2">
                  <Input value={newVal} maxLength={50} onChange={(e) => setNewVal(e.target.value)} placeholder={`Add to ${master[mKey].label.toLowerCase()}…`} />
                  <Button type="submit"><Plus />Add</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="mt-4 space-y-4">
          <Callout title="Devices holding data">Every signed-in phone keeps an offline copy based on the rules above. Revoke devices that are lost or inactive for a long time.</Callout>
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Device</TableHead><TableHead>Last sync</TableHead><TableHead className="text-right">Records stored</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><RepCell id={d.user} /></TableCell>
                    <TableCell><span className="flex items-center gap-2"><Smartphone className="size-4 text-muted-foreground" />{d.device}</span></TableCell>
                    <TableCell className="text-muted-foreground">{d.lastSync}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.records.toLocaleString("en-US")}</TableCell>
                    <TableCell><StatusBadge value={d.status} /></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="destructive" onClick={() => { setDevices(devices.filter((x) => x.id !== d.id)); toast.success("Access revoked — device data will be wiped") }}>Revoke & wipe</Button></TableCell>
                  </TableRow>
                ))}
                {devices.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No devices connected.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Import data</CardTitle><CardDescription>Upload CSV/XLSX. Columns are matched automatically.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <button onClick={() => toast.info("Choose file (mock)")} className="grid w-full place-items-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40">
                <Upload className="size-6" /><span><b className="text-foreground">Click to upload</b> or drag a file here</span><span className="text-xs">Max 10 MB · 20,000 rows</span>
              </button>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Templates</p>
                {["Leads", "Accounts & contacts", "Products & pricing", "Opening receivables"].map((t) => (
                  <button key={t} onClick={() => toast.info(`Download ${t} template (mock)`)} className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left hover:bg-muted/50"><FileSpreadsheet className="size-4 text-muted-foreground" />{t} template.xlsx</button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Import & export history</CardTitle><CardDescription>Last 30 days</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Export", "Leads (42 rows)", "r2", "20 Oct 15:02", "Success"], ["Import", "Products & pricing (8 rows)", "r8", "18 Oct 10:11", "Success"],
                ["Import", "Jakarta event leads (312 rows)", "r1", "14 Oct 09:30", "12 rows failed"], ["Export", "Q3 invoices (96 rows)", "r1", "02 Oct 17:45", "Success"],
              ].map(([k, w, u, t, s], i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <Badge variant="secondary">{k}</Badge>
                  <div className="min-w-0 flex-1"><div className="truncate">{w}</div><div className="text-xs text-muted-foreground">{t}</div></div>
                  <RepCell id={u} /><span className={cn("text-xs", s === "Success" ? "text-success" : "text-warning")}>{s}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
