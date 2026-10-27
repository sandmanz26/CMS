import {
  LayoutDashboard, Users, KanbanSquare, Building2, FileText, Package, FolderOpen, BookOpen, UsersRound,
  Target, CalendarCheck, BarChart3, Settings, Receipt, CalendarRange, ClipboardCheck, Gauge, Database, Map,
  type LucideIcon,
} from "lucide-react"

/**
 * `tier` decides at which screen size an item sits in the dock:
 * 1 = always (incl. mobile), 2 = tablet and up, 3 = desktop, 0 = Launchpad only.
 * Every item is always reachable from the Launchpad and ⌘K search.
 */
export type NavItem = { to: string; label: string; short: string; icon: LucideIcon; tier: 0 | 1 | 2 | 3; badge?: number }
export type NavGroup = { label: string; items: NavItem[] }

export const navGroups: NavGroup[] = [
  { label: "Overview", items: [
    { to: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard, tier: 1 },
    { to: "/division", label: "Sales Division", short: "Division", icon: Gauge, tier: 2 },
    { to: "/analytics", label: "Analytics", short: "Analytics", icon: BarChart3, tier: 3 },
  ] },
  { label: "Sales", items: [
    { to: "/leads", label: "Leads", short: "Leads", icon: Users, tier: 1 },
    { to: "/pipeline", label: "Pipeline", short: "Pipeline", icon: KanbanSquare, tier: 1 },
    { to: "/territories", label: "Territories", short: "Map", icon: Map, tier: 2 },
    { to: "/accounts", label: "Accounts", short: "Accounts", icon: Building2, tier: 3 },
    { to: "/quotes", label: "Quotes", short: "Quotes", icon: FileText, tier: 2 },
    { to: "/tasks", label: "Tasks", short: "Tasks", icon: CalendarCheck, tier: 2, badge: 5 },
  ] },
  { label: "Revenue", items: [
    { to: "/targets", label: "Revenue Targets", short: "Targets", icon: Target, tier: 1 },
    { to: "/invoices", label: "Invoices", short: "Invoices", icon: Receipt, tier: 2 },
    { to: "/payment-terms", label: "Payment Terms", short: "Terms", icon: CalendarRange, tier: 0 },
    { to: "/approvals", label: "Approvals", short: "Approvals", icon: ClipboardCheck, tier: 3, badge: 4 },
  ] },
  { label: "Enablement", items: [
    { to: "/materials", label: "Materials", short: "Materials", icon: FolderOpen, tier: 2 },
    { to: "/products", label: "Products & Pricing", short: "Products", icon: Package, tier: 0 },
    { to: "/playbooks", label: "Playbooks", short: "Playbooks", icon: BookOpen, tier: 0 },
  ] },
  { label: "Admin", items: [
    { to: "/team", label: "Team", short: "Team", icon: UsersRound, tier: 0 },
    { to: "/data", label: "Data & Access", short: "Data", icon: Database, tier: 0 },
    { to: "/settings", label: "Settings", short: "Settings", icon: Settings, tier: 0 },
  ] },
]

export const allNav = navGroups.flatMap((g) => g.items)

/** Match a path to a nav item (supports sub-paths such as /leads/L-1001). */
export const findNav = (pathname: string) =>
  allNav.find((i) => (i.to === "/" ? pathname === "/" : pathname === i.to || pathname.startsWith(`${i.to}/`)))
