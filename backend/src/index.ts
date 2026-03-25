/**
 * Backend entry point - re-exports main server bootstrap
 */

export { initializeSocketEngine, emitToNamespace, getSocketCount } from './socket/socket.engine';
export { OrderEventType, NotificationEventType, UserEventType, AdminEventType, ChatEventType, RoomPatterns } from './socket/events/event-catalog';
export { AppError } from './utils/app-error';
export { Logger } from './utils/logger';
export { ResponseBuilder } from './utils/response-builder';
export { env } from './config/env';
