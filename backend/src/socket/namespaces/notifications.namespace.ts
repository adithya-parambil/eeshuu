import { Server as SocketIOServer } from 'socket.io'
import { log } from '../../utils/logger'
import { RoomPatterns, buildEvent } from '../events/event-catalog'
import { joinRoom, broadcastToRoom } from '../rooms/room-manager'

/**
 * setupNotificationsNamespace — wires the /notifications Socket.io namespace.
 *
 * On connect: auto-join user:{userId} room so targeted pushes work
 * without the client needing to emit a join event.
 */
export function setupNotificationsNamespace(io: SocketIOServer): void {
  const nsp = io.of('/notifications')

  nsp.on('connection', (socket) => {
    const userId = socket.data.userId as string

    log.info({ socketId: socket.id, userId }, 'Notifications namespace: socket connected')

    // Auto-join personal notification room
    joinRoom(socket, RoomPatterns.USER(userId))

    socket.on('disconnect', (reason) => {
      log.info({ socketId: socket.id, userId, reason }, 'Notifications namespace: socket disconnected')
    })
  })
}

/**
 * sendUserNotification — push a notification to a specific user.
 * Works across instances when Redis adapter is active.
 */
export function sendUserNotification(
  io: SocketIOServer,
  userId: string,
  type: string,
  message: string,
): void {
  const nsp = io.of('/notifications')
  broadcastToRoom(
    nsp,
    RoomPatterns.USER(userId),
    'v1:NOTIFICATION:NEW',
    buildEvent({ userId, type, message }),
  )
}
