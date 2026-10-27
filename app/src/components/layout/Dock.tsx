import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { findNav, navGroups, type NavItem } from "./nav"

const BASE = 44 // resting icon size (px)
const GROW = 18 // extra size when the pointer is right over an icon
const RANGE = 150 // pointer distance (px) that still affects an icon

/** macOS-style magnification. Only for mouse/trackpad, and off when the user prefers reduced motion. */
function useMagnify(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ok = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 768px)")
    let frame = 0
    const items = () => [...el.querySelectorAll<HTMLElement>("[data-dock-tile]")]
    const reset = () => items().forEach((i) => i.style.removeProperty("--s"))
    const move = (e: PointerEvent) => {
      if (!ok.matches || e.pointerType !== "mouse") return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        for (const i of items()) {
          const r = i.getBoundingClientRect()
          const d = Math.abs(e.clientX - (r.left + r.width / 2))
          const t = Math.max(0, 1 - d / RANGE)
          i.style.setProperty("--s", `${BASE + GROW * Math.sin((t * Math.PI) / 2)}px`)
        }
      })
    }
    const leave = () => { cancelAnimationFrame(frame); reset() }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    ok.addEventListener("change", leave)
    return () => { cancelAnimationFrame(frame); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); ok.removeEventListener("change", leave) }
  }, [ref])
}

const tierClass: Record<number, string> = { 1: "flex", 2: "hidden md:flex", 3: "hidden lg:flex" }

function Tile({ icon: Icon, active, className }: { icon: NavItem["icon"]; active?: boolean; className?: string }) {
  return (
    <span
      data-dock-tile
      style={{ width: "var(--s, var(--tile))", height: "var(--s, var(--tile))" }}
      className={cn(
        "grid shrink-0 place-items-center rounded-[26%] transition-[width,height,background-color,color] duration-150 ease-out",
        active
          ? "bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_color-mix(in_oklch,var(--primary),transparent_40%)]"
          : "bg-card text-foreground/75 ring-1 ring-border shadow-[0_1px_2px_rgb(0_0_0/0.06)] group-hover/dock:text-foreground",
        className,
      )}
    >
      <Icon className="size-[44%]" strokeWidth={1.9} />
    </span>
  )
}

function DockLink({ item, extraClass }: { item: NavItem; extraClass?: string }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      aria-label={item.label}
      className={({ isActive }) => cn("group/dock relative flex-col items-center gap-1 rounded-2xl outline-none max-md:flex-1", extraClass ?? tierClass[item.tier], isActive && "is-active")}
    >
      {({ isActive }) => (
        <>
          {/* floating label (desktop) */}
          <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/dock:opacity-100 group-focus-visible/dock:opacity-100 md:block">
            {item.label}
          </span>
          <span className="relative rounded-[28%] group-focus-visible/dock:ring-2 group-focus-visible/dock:ring-ring group-focus-visible/dock:ring-offset-2 group-focus-visible/dock:ring-offset-background">
            <Tile icon={item.icon} active={isActive} />
            {item.badge ? (
              <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-background" aria-label={`${item.badge} new`}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </span>
          {/* label below (mobile) */}
          <span className={cn("max-w-16 truncate text-[10px] leading-none md:hidden", isActive ? "font-semibold text-foreground" : "text-muted-foreground")}>{item.short}</span>
          {/* active page indicator */}
          <span className={cn("size-1 rounded-full bg-foreground/70 transition-opacity max-md:hidden", isActive ? "opacity-100" : "opacity-0")} />
        </>
      )}
    </NavLink>
  )
}

function Divider({ className }: { className?: string }) {
  return <span aria-hidden className={cn("mx-1 hidden h-10 w-px self-center bg-foreground/15 md:block", className)} />
}

export default function Dock({ onLaunchpad, launchpadOpen }: { onLaunchpad: () => void; launchpadOpen: boolean }) {
  const ref = useRef<HTMLElement>(null)
  useMagnify(ref)
  const { pathname } = useLocation()
  const current = findNav(pathname)
  // A page that is open but has no dock slot shows up like a "running app" (tablet & desktop)
  const running = current && current.tier === 0 ? current : null
  // On smaller screens, an active item hidden from the dock is signalled by a dot on the Launchpad button
  const hiddenOn = current ? (current.tier === 0 ? "md:hidden" : current.tier === 2 ? "md:hidden" : current.tier === 3 ? "lg:hidden" : "hidden") : "hidden"
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const groups = navGroups.map((g) => g.items.filter((i) => i.tier > 0)).filter((g) => g.length)

  return (
    <nav
      ref={ref}
      aria-label="Main navigation"
      style={{ ["--tile" as string]: `${BASE}px` }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex justify-center px-0 transition-transform duration-300 md:bottom-3 md:px-4",
        "pb-[env(safe-area-inset-bottom)] md:pb-0",
        mounted ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div
        className={cn(
          "flex w-full items-end justify-around gap-1 border-t bg-background/75 px-2 pt-2 pb-2 shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.2)] backdrop-blur-2xl backdrop-saturate-150",
          "max-md:[--tile:34px]",
          "md:w-auto md:justify-center md:gap-2 md:rounded-[22px] md:border md:border-white/40 md:px-2.5 md:pt-2.5 md:pb-1.5 md:shadow-[0_10px_40px_-10px_rgb(0_0_0/0.35)] dark:md:border-white/10",
        )}
      >
        {groups.map((g, gi) => (
          <div key={gi} className="contents">
            {gi > 0 && <Divider className={g.every((i) => i.tier === 3) ? "hidden lg:block" : undefined} />}
            {g.map((item) => <DockLink key={item.to} item={item} />)}
          </div>
        ))}

        {running && (
          <>
            <Divider />
            <DockLink item={running} extraClass="hidden md:flex" />
          </>
        )}

        <Divider />
        <button
          type="button"
          onClick={onLaunchpad}
          aria-label="Open all apps (Launchpad)"
          aria-haspopup="dialog"
          aria-expanded={launchpadOpen}
          className="group/dock relative flex flex-col items-center gap-1 rounded-2xl outline-none max-md:flex-1"
        >
          <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/dock:opacity-100 group-focus-visible/dock:opacity-100 md:block">All apps</span>
          <span className="rounded-[28%] group-focus-visible/dock:ring-2 group-focus-visible/dock:ring-ring group-focus-visible/dock:ring-offset-2 group-focus-visible/dock:ring-offset-background">
            <Tile icon={LayoutGrid} active={launchpadOpen} />
          </span>
          <span className={cn("text-[10px] leading-none md:hidden", current && current.tier !== 1 ? "font-semibold text-foreground" : "text-muted-foreground")}>More</span>
          <span className={cn("size-1 rounded-full bg-foreground/70 max-md:hidden", launchpadOpen ? "opacity-100" : "opacity-0")} />
          {/* active item that is hidden at this dock size */}
          <span className={cn("absolute top-0 right-1/2 size-2 translate-x-[calc(var(--tile)/2)] rounded-full bg-primary ring-2 ring-background", hiddenOn)} aria-hidden />
        </button>
      </div>
    </nav>
  )
}
