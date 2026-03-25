import { Server as SocketIOServer } from 'socket.io'
import { log } from '../../utils/logger'
import { EVENTS, RoomPatterns, buildEvent } from '../events/event-catalog'
import { broadcastToRoom } from '../rooms/room-manager'

/**
 * setupAdminNamespace — wires the /admin Socket.io namespace.
 *
 * Access: admin role only (enforced in namespace middleware).
 * On connect: auto-join admin:dashboard room.
 */
export function setupAdminNamespace(io: SocketIOServer): void {
  const nsp = io.of('/admin')

  // Namespace-level role guard — reject non-admins before connection
  nsp.use((socket, next) => {
    if (socket.data.role !== 'admin') {
      return next(new Error('FORBIDDEN'))
    }
    next()
  })

  nsp.on('connection', (socket) => {
    const userId = socket.data.userId as string

    log.info({ socketId: socket.id, userId }, 'Admin namespace: socket connected')

    // Auto-join admin dashboard room
    socket.join(RoomPatterns.ADMIN())

    socket.on('disconnect', (reason) => {
      log.info({ socketId: socket.id, userId, reason }, 'Admin namespace: socket disconnected')
    })
  })
}

/**
 * broadcastSystemError — push a system error event to all connected admins.
 * Called from anywhere in the app that needs to alert the admin dashboard.
 */
export function broadcastSystemError(
  io: SocketIOServer,
  code: string,
  message: string,
): void {
  const nsp = io.of('/admin')
  broadcastToRoom(
    nsp,
    RoomPatterns.ADMIN(),
    EVENTS.SYSTEM_ERROR,
    buildEvent({ code, message }),
  )
}
