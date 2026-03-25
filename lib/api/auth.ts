import { apiClient } from './client'
import type { TokenPair, User } from '@/types'

export const authApi = {
  register: (body: {
    name: string
    email: string
    password: string
    role: 'customer' | 'delivery'
    phone?: string
  }) => apiClient.post<{ success: true; data: TokenPair }>('/auth/register', body),

  login: (body: { email: string; password: string }) =>
    apiClient.post<{ success: true; data: TokenPair }>('/auth/login', body),

  logout: () => apiClient.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ success: true; data: TokenPair }>('/auth/refresh', { refreshToken }),

  getProfile: () => apiClient.get<{ success: true; data: User }>('/users/me'),
}
