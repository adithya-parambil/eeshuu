import { apiClient } from './client'
import type { Rating, PartnerRatings } from '@/types'

export const ratingsApi = {
  submit: (body: { orderId: string; rating: number; comment?: string }) =>
    apiClient.post<{ success: true; data: Rating }>('/ratings', body),

  getForOrder: (orderId: string) =>
    apiClient.get<{ success: true; data: Rating | null }>(`/ratings/order/${orderId}`),

  getForPartner: (partnerId: string) =>
    apiClient.get<{ success: true; data: PartnerRatings }>(`/ratings/partner/${partnerId}`),
}
