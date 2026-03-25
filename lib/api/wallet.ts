import { apiClient } from './client'
import type { WalletBalance, WalletTransaction } from '@/types'

export const walletApi = {
  getBalance: () =>
    apiClient.get<{ success: true; data: WalletBalance }>('/wallet/balance'),

  withdraw: (amount: number) =>
    apiClient.post<{ success: true; data: WalletBalance }>('/wallet/withdraw', { amount }),

  getTransactions: (page = 1, limit = 20) =>
    apiClient.get<{ success: true; data: WalletTransaction[] }>(`/wallet/transactions?page=${page}&limit=${limit}`),
}
