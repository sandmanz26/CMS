import { Component, useEffect, useState, type ReactNode } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Bell, ChevronRight, LogOut, Moon, Search, Settings, Sun, Zap, RotateCcw } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Toaster } from "@/components/ui/sonner"
import { accounts } from "@/data/mock"
import { invoices } from "@/data/finance"
import { useAlerts } from "@/data/alerts"
import { useApp } from "@/data/store"
import { cn } from "@/lib/utils"
import Dock from "./Dock"
import Launchpad from "./Launchpad"
import { allNav, findNav, navGroups } from "./nav"

/** Catches a render error in one page so the rest of the app (dock, menu bar) keeps working. */
class PageErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto grid max-w-md place-items-center gap-3 py-20 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-red-500/10 text-red-600"><RotateCcw className="size-5" /></div>
        <h1 className="text-lg font-semibold">This page failed to load</h1>
        <p className="text-sm text-muted-foreground">Something unexpected went wrong. Your data is safe — try again or open another app from the dock.</p>
        <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs">{this.state.error.message}</code>
        <Button onClick={() => this.setState({ error: null })}>Try again</Button>
      </div>
    )
  }
}

export default function AppLayout() {
  const { resolvedTheme, setTheme } = useTheme()
  const [search, setSearch] = useState(false)
  const [launchpad, setLaunchpad] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const current = findNav(pathname)
  const group = navGroups.find((g) => g.items.some((i) => i.to === current?.to))
  const alerts = useAlerts()
  const { leads, deals } = useApp()

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setLaunchpad(false); setSearch((o) => !o) }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [])
  // Page change → close overlays and scroll to top
  useEffect(() => { setSearch(false); setLaunchpad(false); window.scrollTo({ top: 0 }) }, [pathname])
  useEffect(() => { document.title = `${current?.label ?? "Page not found"} · SalesHub` }, [current])

  const go = (to: string) => { setSearch(false); navigate(to) }

  return (
    <div className="min-h-dvh">
      <a href="#konten" className="sr-only z-[60] rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Skip to content</a>

      {/* macOS-style menu bar */}
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur-xl backdrop-saturate-150 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-2 px-3 md:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 rounded-lg pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="SalesHub — go to Dashboard">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground"><Zap className="size-3.5" /></span>
            <span className="text-sm font-semibold max-sm:hidden">SalesHub</span>
          </Link>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
            {group && <><ChevronRight className="size-3.5 shrink-0 max-sm:hidden" /><span className="shrink-0 max-md:hidden">{group.label}</span></>}
            <ChevronRight className="size-3.5 shrink-0 max-md:hidden" />
            <span className="truncate font-medium text-foreground" aria-current="page">{current?.label ?? "Not found"}</span>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button variant="outline" className="h-8 w-52 justify-start gap-2 rounded-full bg-background/60 text-muted-foreground max-md:hidden" onClick={() => setSearch(true)}>
              <Search /> Search anything…<kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">⌘K</kbd>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setSearch(true)}><Search /></Button>
            <Popover>
              <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={`Notifications, ${alerts.length} new`} className="relative" />}>
                <Bell />{alerts.length > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-background" />}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] p-0">
                <div className="flex items-center justify-between border-b px-4 py-3"><span className="text-sm font-semibold">Notifications</span><span className="text-xs text-muted-foreground">{alerts.length} new</span></div>
                <div className="max-h-[min(20rem,60dvh)] overflow-y-auto">
                  {alerts.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">You’re all caught up.</p>}
                  {alerts.map((a) => (
                    <button key={a.id} onClick={() => navigate(a.link)} className="flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted/50">
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.level === "critical" ? "bg-danger" : a.level === "warning" ? "bg-warning" : "bg-brand-2")} />
                      <span className="min-w-0"><span className="block text-sm font-medium">{a.title}</span><span className="line-clamp-2 text-xs text-muted-foreground">{a.detail}</span></span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" aria-label={resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              <Sun className="dark:hidden" /><Moon className="hidden dark:block" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu" />}>
                <Avatar className="size-8"><AvatarFallback className="bg-secondary text-xs font-medium ring-1 ring-border">HK</AvatarFallback></Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel><div className="text-sm font-medium text-foreground">Hendra Kusuma</div><div className="text-xs font-normal">Admin · hendra@bluesilo.id</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}><Settings />Settings</DropdownMenuItem>
                <DropdownMenuItem><LogOut />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main id="konten" className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-6 md:pb-32">
        <PageErrorBoundary resetKey={pathname}><Outlet /></PageErrorBoundary>
      </main>

      <Dock onLaunchpad={() => setLaunchpad((o) => !o)} launchpadOpen={launchpad} />
      <Launchpad open={launchpad} onOpenChange={setLaunchpad} />

      <CommandDialog open={search} onOpenChange={setSearch}>
        <CommandInput placeholder="Search leads, deals, accounts, invoices or pages…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {allNav.map((i) => <CommandItem key={i.to} onSelect={() => go(i.to)}><i.icon />{i.label}</CommandItem>)}
          </CommandGroup>
          <CommandGroup heading="Leads">
            {leads.map((l) => <CommandItem key={l.id} onSelect={() => go(`/leads/${l.id}`)}>{l.name} — {l.company}</CommandItem>)}
          </CommandGroup>
          <CommandGroup heading="Deals">
            {deals.map((d) => <CommandItem key={d.id} onSelect={() => go("/pipeline")}>{d.title} — {d.company}</CommandItem>)}
          </CommandGroup>
          <CommandGroup heading="Invoice">
            {invoices.map((v) => <CommandItem key={v.id} onSelect={() => go("/invoices")}>{v.id} — {v.company}</CommandItem>)}
          </CommandGroup>
          <CommandGroup heading="Accounts">
            {accounts.map((a) => <CommandItem key={a.id} onSelect={() => go("/accounts")}>{a.name}</CommandItem>)}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <Toaster richColors position="top-center" offset={64} mobileOffset={{ top: 56 }} />
    </div>
  )
}
