import { io, type Socket } from 'socket.io-client'
import { tokenStore } from '@/lib/token-store'
import { onTokenRefreshed } from '@/lib/events/token-events'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost'

// ─── Singleton sockets per namespace ─────────────────────────────────────────
const sockets: Map<string, Socket> = new Map()

function applyLatestAuth(socket: Socket) {
  socket.auth = { token: tokenStore.getAccess() ?? '', versions: ['v1'] }
}

export function getSocket(namespace: '/order' | '/admin' | '/notifications' | '/wallet'): Socket {
  if (sockets.has(namespace)) return sockets.get(namespace)!

  const socket = io(`${SOCKET_URL}${namespace}`, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: { token: tokenStore.getAccess() ?? '', versions: ['v1'] },
    reconnection: true,
    reconnectionAttempts: 100,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  socket.on('reconnect_attempt', () => {
    applyLatestAuth(socket)
  })

  sockets.set(namespace, socket)
  return socket
}

export function connectSocket(namespace: '/order' | '/admin' | '/notifications' | '/wallet') {
  const socket = getSocket(namespace)
  applyLatestAuth(socket)
  if (!socket.connected) socket.connect()
  return socket
}

export function disconnectSocket(namespace: '/order' | '/admin' | '/notifications' | '/wallet') {
  const socket = sockets.get(namespace)
  if (socket) {
    socket.disconnect()
    sockets.delete(namespace)
  }
}

// ─── Client-side event deduplication ─────────────────────────────────────────
const seenEventIds = new Map<string, number>()
const DEDUP_TTL_MS = 30_000

export function isDuplicate(eventId: string): boolean {
  const now = Date.now()
  // Cleanup old entries
  for (const [id, ts] of seenEventIds) {
    if (now - ts > DEDUP_TTL_MS) seenEventIds.delete(id)
  }
  if (seenEventIds.has(eventId)) return true
  seenEventIds.set(eventId, now)
  return false
}

export function refreshAllSocketsAuth() {
  for (const [, socket] of sockets) {
    applyLatestAuth(socket)
    if (socket.connected) {
      socket.disconnect()
      socket.connect()
    }
  }
}

let subscribed = false
if (!subscribed) {
  onTokenRefreshed(() => {
    refreshAllSocketsAuth()
  })
  subscribed = true
}

export function disconnectAllSockets() {
  for (const [, socket] of sockets) {
    try {
      socket.disconnect()
    } catch {}
  }
  sockets.clear()
}
