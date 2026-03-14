'use client'

import { createContext, useCallback, use, useMemo, useRef, useSyncExternalStore } from 'react'

type Store = {
  active: number
  subscribe: (cb: () => void) => () => void
  getSnapshot: () => number
  increment: () => void
  decrement: () => void
}

function createStore(): Store {
  let active = 0
  const listeners = new Set<() => void>()
  return {
    get active() { return active },
    subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb) },
    getSnapshot() { return active },
    increment() { active++; listeners.forEach(cb => cb()) },
    decrement() { active = Math.max(0, active - 1); listeners.forEach(cb => cb()) },
  }
}

const store = createStore()

const ActivityContext = createContext(store)

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  return <ActivityContext value={store}>{children}</ActivityContext>
}

export function useActivitySignal() {
  const s = use(ActivityContext)
  const increment = useCallback(() => s.increment(), [s])
  const decrement = useCallback(() => s.decrement(), [s])
  return useMemo(() => ({ increment, decrement }), [increment, decrement])
}

export function useIsActive(): boolean {
  const s = use(ActivityContext)
  const active = useSyncExternalStore(s.subscribe, s.getSnapshot, s.getSnapshot)
  return active > 0
}
