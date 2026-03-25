import { Server as SocketIOServer, Namespace, Socket } from 'socket.io'
import { log } from '../../utils/logger'

/**
 * joinRoom — adds a socket to a named room and logs it.
 */
export function joinRoom(socket: Socket, room: string): void {
  socket.join(room)
  log.debug({ socketId: socket.id, userId: socket.data.userId, room }, 'Socket joined room')
}

/**
 * leaveRoom — removes a socket from a named room and logs it.
 */
export function leaveRoom(socket: Socket, room: string): void {
  socket.leave(room)
  log.debug({ socketId: socket.id, userId: socket.data.userId, room }, 'Socket left room')
}

/**
 * broadcastToRoom — emits an event to all sockets in a room.
 * Works transparently with both in-memory and Redis adapters.
 */
export function broadcastToRoom(
  target: SocketIOServer | Namespace,
  room: string,
  event: string,
  payload: unknown,
): void {
  target.to(room).emit(event, payload)
  log.debug({ room, event }, 'Broadcast to room')
}
