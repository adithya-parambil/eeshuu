import { Server as SocketIOServer } from 'socket.io'
import { log } from '../../utils/logger'
import { walletEventEmitter } from '../../utils/event-emitters'
import { RoomPatterns, buildEvent } from '../events/event-catalog'
import { broadcastToRoom } from '../rooms/room-manager'

/**
 * Setup Wallet namespace - handles real-time wallet updates for users.
 * 
 * Room conventions:
 *   user:{userId} - user's personal room for wallet updates
 */
export function setupWalletNamespace(io: SocketIOServer): void {
    const nsp = io.of('/wallet')

    // ── Listen for wallet.updated events from the event emitter ─────────────────
    walletEventEmitter.on('wallet.updated', (payload: {
        userId: string
        balance: number
        delta: number
        type: string
    }) => {
        const event = buildEvent({
            userId: payload.userId,
            balance: payload.balance,
            delta: payload.delta,
            type: payload.type,
        })

        // Broadcast to the specific user's room
        broadcastToRoom(
            nsp,
            RoomPatterns.USER(payload.userId),
            'v1:WALLET:UPDATED',
            event,
        )

        log.info({ userId: payload.userId, balance: payload.balance }, 'v1:WALLET:UPDATED emitted')
    })

    nsp.on('connection', (socket) => {
        const userId = socket.data.userId as string

        log.info({ socketId: socket.id, userId }, 'Wallet namespace: socket connected')

        // Auto-join user to their personal room
        socket.join(RoomPatterns.USER(userId))

        socket.on('disconnect', (reason) => {
            log.info({ socketId: socket.id, userId, reason }, 'Wallet namespace: socket disconnected')
        })
    })
}
