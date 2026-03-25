import { apiClient } from './client'
import type { Dispute, ApiMeta } from '@/types'

export const disputesApi = {
  raise: (body: { orderId: string; subject: string; description: string }) =>
    apiClient.post<{ success: true; data: Dispute }>('/disputes', body),

  list: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ success: true; data: Dispute[]; meta: ApiMeta }>('/disputes', { params }),

  respond: (disputeId: string, body: { adminResponse: string; status: 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' }) =>
    apiClient.put<{ success: true; data: Dispute }>(`/disputes/${disputeId}`, body),
}
