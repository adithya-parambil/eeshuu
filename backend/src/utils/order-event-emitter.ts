import { EventEmitter } from 'events'

/**
 * orderEventEmitter — shared internal event bus for order lifecycle events.
 *
 * Producers:  PlaceOrderUseCase  → emits 'order.placed'
 *             CancelOrderUseCase → emits 'order.cancelled'
 *
 * Consumers:  setupOrderNamespace (socket layer) → translates to Socket.io broadcasts
 *
 * This decouples the use-case layer from the socket layer:
 * use-cases never import from sockets/, sockets never import business logic.
 */
export const orderEventEmitter = new EventEmitter()
