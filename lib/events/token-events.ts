type Listener = (token: string) => void
const listeners = new Set<Listener>()

export function emitTokenRefreshed(token: string) {
  for (const fn of Array.from(listeners)) {
    try { fn(token) } catch {}
  }
}

export function onTokenRefreshed(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
