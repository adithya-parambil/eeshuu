import { apiClient } from './client'
import type { Product, ApiMeta } from '@/types'

export const productsApi = {
  list: (params?: { page?: number; limit?: number; category?: string; search?: string }) =>
    apiClient.get<{ success: true; data: Product[]; meta: ApiMeta }>('/products', { params }),

  get: (id: string) =>
    apiClient.get<{ success: true; data: Product }>(`/products/${id}`),

  create: (body: {
    name: string
    description?: string
    price: number
    category: string
    stock: number
    imageUrl?: string
  }) => apiClient.post<{ success: true; data: Product }>('/products', body),

  update: (id: string, body: Partial<{
    name: string
    description: string
    price: number
    category: string
    stock: number
    imageUrl: string
    isActive: boolean
  }>) => apiClient.put<{ success: true; data: Product }>(`/products/${id}`, body),

  delete: (id: string) =>
    apiClient.delete<{ success: true; data: { deleted: boolean } }>(`/products/${id}`),
}
