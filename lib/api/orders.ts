import { apiClient } from './client'
import type { Order, OrderItem, DeliveryAddress, ApiMeta } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export const ordersApi = {
  // Customer
  place: (
    body: { items: { productId: string; quantity: number }[]; deliveryAddress: DeliveryAddress },
    idempotencyKey?: string,
  ) =>
    apiClient.post<{ success: true; data: Order }>(
      '/orders',
      body,
      { headers: { 'Idempotency-Key': idempotencyKey ?? uuidv4() } },
    ),

  list: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ success: true; data: Order[]; meta: ApiMeta }>('/orders', { params }),

  get: (id: string) =>
    apiClient.get<{ success: true; data: Order }>(`/orders/${id}`),

  cancel: (id: string, reason?: string) =>
    apiClient.delete<{ success: true; data: Order }>(`/orders/${id}`, { data: { reason } }),

  // Delivery
  listAvailable: () =>
    apiClient.get<{ success: true; data: Order[]; meta: ApiMeta }>('/orders/available'),

  getMyActive: () =>
    apiClient.get<{ success: true; data: Order | null }>('/orders/my-active'),

  getMyEarnings: () =>
    apiClient.get<{ success: true; data: import('@/types').DeliveryEarnings }>('/orders/my-earnings'),

  getMyHistory: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ success: true; data: Order[]; meta: ApiMeta }>('/orders/my-history', { params }),

  accept: (id: string) =>
    apiClient.post<{ success: true; data: Order }>(`/orders/${id}/accept`),

  updateStatus: (id: string, status: string) =>
    apiClient.put<{ success: true; data: Order }>(`/orders/${id}/status`, { status }),

  getPartnerLocation: (id: string) =>
    apiClient.get<{ success: true; data: { lat: number; lng: number; accuracy?: number; updatedAt: string } | null }>(`/orders/${id}/location`),
}
