import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Search, X } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { findNav, navGroups } from "./nav"

/** Full-screen view of every app, inspired by the macOS Launchpad. */
export default function Launchpad({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("")
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const current = findNav(pathname)

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    return navGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => !s || i.label.toLowerCase().includes(s) || g.label.toLowerCase().includes(s)) }))
      .filter((g) => g.items.length)
  }, [q])
  const first = groups[0]?.items[0]

  const go = (to: string) => { onOpenChange(false); setQ(""); navigate(to) }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ("") }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-background/60 backdrop-blur-2xl duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          aria-label="All apps"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-105 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-105"
          onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}
        >
          <div className="mx-auto w-full max-w-4xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-32 md:pt-14" onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}>
            <DialogPrimitive.Title className="sr-only">All apps</DialogPrimitive.Title>
            <div className="mx-auto mb-8 flex max-w-sm items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && first) go(first.to) }}
                  placeholder="Search apps…"
                  aria-label="Search apps"
                  className="h-9 w-full rounded-full border bg-background/70 pr-3 pl-9 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <DialogPrimitive.Close className="grid size-9 place-items-center rounded-full border bg-background/70 hover:bg-background" aria-label="Close">
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>

            {groups.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">No app matches “{q}”.</p>}

            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.label}>
                  <h2 className="mb-3 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.label}</h2>
                  <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-6">
                    {g.items.map((i) => (
                      <button
                        key={i.to}
                        onClick={() => go(i.to)}
                        className="group flex flex-col items-center gap-2 rounded-2xl p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className={cn(
                          "relative grid size-14 place-items-center rounded-[26%] transition-transform group-hover:scale-105 group-active:scale-95 md:size-16",
                          current?.to === i.to ? "bg-primary text-primary-foreground" : "bg-card text-foreground/80 ring-1 ring-border shadow-sm",
                        )}>
                          <i.icon className="size-[42%]" strokeWidth={1.8} />
                          {i.badge ? <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-background">{i.badge}</span> : null}
                        </span>
                        <span className={cn("line-clamp-2 text-xs leading-tight", current?.to === i.to ? "font-semibold" : "text-foreground/80")}>{i.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
