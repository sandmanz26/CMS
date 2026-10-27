import { useEffect, useState } from "react"
import { Briefcase, Mail, MapPin, MessageCircle, NotebookPen, Phone, Repeat } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FormError, SimpleSelect } from "@/components/common/bits"
import { logActivity } from "@/data/store"
import { ME, activityTypes, type ActivityType, type Lead, type Outcome } from "@/data/sales"
import { TODAY, addDays, isValidDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export const activityIcon: Record<ActivityType, typeof Phone> = {
  Visit: MapPin, Meeting: Briefcase, Call: Phone, "Follow-up": Repeat, Email: Mail, WhatsApp: MessageCircle, Note: NotebookPen,
}
const outcomes: Outcome[] = ["Positive", "Neutral", "No response", "Negative"]

export function LogActivityDialog({ lead, open, onOpenChange, defaultType = "Call" }: { lead: Lead; open: boolean; onOpenChange: (o: boolean) => void; defaultType?: ActivityType }) {
  const [type, setType] = useState<ActivityType>(defaultType)
  const [date, setDate] = useState(TODAY)
  const [time, setTime] = useState("10:00")
  const [outcome, setOutcome] = useState<Outcome>("Positive")
  const [note, setNote] = useState("")
  const [next, setNext] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setType(defaultType); setDate(TODAY); setTime(new Date().toTimeString().slice(0, 5)); setOutcome("Positive"); setNote(""); setNext(addDays(TODAY, 3)); setError("")
  }, [open, defaultType])

  const submit = () => {
    if (!isValidDate(date)) return setError("Pick the date the activity happened.")
    if (date > TODAY) return setError("Activities are logged after they happen — the date can't be in the future. Use “Next follow-up” to plan ahead.")
    if (note.trim().length < 5) return setError("Add a short note (at least 5 characters) so the team knows what happened.")
    if (next && (!isValidDate(next) || next < TODAY)) return setError("Next follow-up must be today or later.")
    logActivity({ leadId: lead.id, type, at: `${date}T${time || "09:00"}:00`, by: lead.owner ?? ME, outcome: type === "Note" ? "Neutral" : outcome, note: note.trim(), nextFollowUp: next || null })
    toast.success(`${type} logged for ${lead.name}`, { description: next ? `Next follow-up on ${next}` : undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
          <DialogDescription>{lead.name} · {lead.company}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div role="radiogroup" aria-label="Activity type" className="flex flex-wrap gap-1.5">
            {activityTypes.map((t) => {
              const I = activityIcon[t]
              return (
                <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
                  className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors", type === t ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
                  <I className="size-3.5" />{t}
                </button>
              )
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Date"><Input type="date" value={date} max={TODAY} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Time"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
            <Field label="Outcome"><SimpleSelect className="w-full" disabled={type === "Note"} value={type === "Note" ? "Neutral" : outcome} onChange={(v) => setOutcome(v as Outcome)} options={outcomes.map((o) => ({ value: o, label: o }))} /></Field>
          </div>
          <Field label="What happened?"><Textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "Visit" ? "Who did you meet on-site, what did you see?" : "Summary, objections, agreed next step…"} /></Field>
          <Field label="Next follow-up" hint="Leave empty if no follow-up is planned."><Input type="date" min={TODAY} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
          <FormError>{error}</FormError>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save activity</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
