import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api'

// ─── Token storage helpers ────────────────────────────────────────────────────
export const tokenStore = {
  getAccess: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  getRefresh: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
  set: (access: string, refresh: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  },
  clear: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth_user')
  },
}

// ─── Axios instance ───────────────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach token ───────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Refresh queue ────────────────────────────────────────────────────────────
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

// ─── Response interceptor — 401 → refresh → retry ────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = tokenStore.getRefresh()
      if (!refreshToken) {
        tokenStore.clear()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
            original._retry = true
            resolve(apiClient(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = data.data
        tokenStore.set(accessToken, newRefresh)
        processQueue(accessToken)
        original.headers = { ...original.headers, Authorization: `Bearer ${accessToken}` }
        return apiClient(original)
      } catch {
        // Drain queued requests so they don't hang forever
        refreshQueue.forEach((cb) => cb(''))
        refreshQueue = []
        tokenStore.clear()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
