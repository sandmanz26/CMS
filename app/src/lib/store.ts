import { useSyncExternalStore } from "react"

/**
 * Minimal global store (in-memory, mock only). Lets one page's change — e.g. reassigning a lead —
 * show up everywhere else without a backend. Selectors must return existing references
 * (e.g. `s => s.leads`), not freshly built arrays, to avoid re-render loops.
 */
export function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  const get = () => state
  const set = (fn: (s: T) => T) => {
    state = fn(state)
    listeners.forEach((l) => l())
  }
  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }
  function use(): T
  function use<S>(selector: (s: T) => S): S
  function use<S>(selector?: (s: T) => S) {
    return useSyncExternalStore(subscribe, () => (selector ? selector(state) : state))
  }
  return { get, set, use }
}

/** Small deterministic PRNG so generated mock data is identical on every load. */
export function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
