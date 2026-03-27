import { apiClient } from './client'
import type { CartItem } from '@/types'

export const cartApi = {
  get: () =>
    apiClient.get<{ success: true; data: { items: { productId: any; quantity: number }[] } }>('/cart'),

  update: (items: { productId: string; quantity: number }[]) =>
    apiClient.put<{ success: true; data: any }>('/cart', { items }),
}
