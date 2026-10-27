import { Check, Swords, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/bits"
import { battlecards, playbooks } from "@/data/enablement"
import { repName } from "@/data/sales"
import { fmtDate } from "@/lib/format"

export default function Playbooks() {
  return (
    <>
      <PageHeader title="Playbooks" desc="Step-by-step plays for common situations and competitor battlecards." />
      <Tabs defaultValue="pb">
        <TabsList><TabsTrigger value="pb">Playbooks</TabsTrigger><TabsTrigger value="bc">Competitor battlecards</TabsTrigger></TabsList>
        <TabsContent value="pb" className="mt-4 grid gap-4 lg:grid-cols-3">
          {playbooks.map((p) => (
            <Card key={p.id}>
              <CardHeader><CardTitle>{p.title}</CardTitle><CardDescription>Scenario: {p.scenario} · by {repName(p.owner)}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-2.5 text-sm">
                  {p.steps.map((s, i) => <li key={i} className="flex gap-2.5"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">{i + 1}</span>{s}</li>)}
                </ol>
                <div className="space-y-1"><div className="flex justify-between text-xs text-muted-foreground"><span>Team adoption</span><span>{p.adoption}%</span></div><Progress value={p.adoption} /></div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="bc" className="mt-4 grid gap-4 lg:grid-cols-3">
          {battlecards.map((b) => (
            <Card key={b.id}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Swords className="size-4" />{b.competitor}</CardTitle><CardDescription>Our win rate: <b>{b.winRate}%</b> · updated {fmtDate(b.updated)}</CardDescription></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><div className="mb-1.5 flex items-center gap-1.5 font-medium"><TrendingUp className="size-4 text-danger" />Their strengths</div><div className="flex flex-wrap gap-1.5">{b.strengths.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div></div>
                <div><div className="mb-1.5 flex items-center gap-1.5 font-medium"><TrendingDown className="size-4 text-success" />Their weaknesses</div><ul className="space-y-1">{b.weaknesses.map((s) => <li key={s} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{s}</li>)}</ul></div>
                <div className="rounded-md bg-muted p-3"><div className="mb-1 text-xs font-medium text-muted-foreground uppercase">Talk track</div>{b.talkTrack}</div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </>
  )
}
