import { apiClient } from './client'
import type { Order, User, SystemStats, ApiMeta, Dispute } from '@/types'

export const adminApi = {
  getStats: () =>
    apiClient.get<{ success: true; data: SystemStats }>('/admin/stats'),

  listOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ success: true; data: Order[]; meta: ApiMeta }>('/admin/orders', { params }),

  listUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    apiClient.get<{ success: true; data: User[]; meta: ApiMeta }>('/admin/users', { params }),

  listDisputes: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ success: true; data: Dispute[]; meta: ApiMeta }>('/admin/disputes', { params }),
}
