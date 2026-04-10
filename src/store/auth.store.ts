import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  email_verified: number
  last_login_at?: number
  created_at: number
  updated_at: number
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  loading: boolean

  // Actions
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),

      login: async (email, password) => {
        set({ loading: true })
        try {
          const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: send/receive cookies
            body: JSON.stringify({ email, password })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '登录失败')
          }

          const data = await response.json()
          set({
            user: data.user,
            isAuthenticated: true,
            loading: false
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (email, password, name) => {
        set({ loading: true })
        try {
          const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '注册失败')
          }

          // Registration successful, now login
          await useAuthStore.getState().login(email, password)
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await fetch('http://localhost:3001/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          })
        } finally {
          set({
            user: null,
            isAuthenticated: false
          })
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await fetch('http://localhost:3001/api/auth/me', {
            credentials: 'include'
          })

          if (response.ok) {
            const data = await response.json()
            set({
              user: data.user,
              isAuthenticated: true
            })
          } else {
            // Token invalid or expired, clear auth
            set({
              user: null,
              isAuthenticated: false
            })
          }
        } catch (error) {
          console.error('Failed to fetch current user:', error)
          set({
            user: null,
            isAuthenticated: false
          })
        }
      },

      clearAuth: () => set({
        user: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
