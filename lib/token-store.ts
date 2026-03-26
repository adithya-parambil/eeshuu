// ─── Token storage helpers ───────────────────────────────────────────────────
// Extracted to separate module to avoid circular dependency with socket-client.ts

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
