import { create } from 'zustand'
import { api } from '../api/client.js'

export interface Notification {
  id: string
  user_id: string
  type: 'approval_request' | 'approval_approved' | 'approval_rejected' | 'approval_next_step'
  title: string
  content: string
  link?: string
  read: boolean
  created_at: number
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean

  // Actions
  fetchNotifications: (token: string, filters?: { read?: boolean; limit?: number; offset?: number }) => Promise<void>
  fetchUnreadCount: (token: string) => Promise<void>
  markAsRead: (id: string, token: string) => Promise<void>
  markAllAsRead: (token: string) => Promise<void>
  markBatchAsRead: (ids: string[], token: string) => Promise<void>
  deleteNotification: (id: string, token: string) => Promise<void>
  deleteAll: (token: string) => Promise<void>
  deleteBatch: (ids: string[], token: string) => Promise<void>

  // Optimistic updates
  optimisticMarkAsRead: (id: string) => void
  optimisticDelete: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (token, filters) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filters?.read !== undefined) params.append('read', String(filters.read))
      if (filters?.limit) params.append('limit', String(filters.limit))
      if (filters?.offset) params.append('offset', String(filters.offset))

      const { notifications } = await api.get<{ notifications: Notification[] }>(
        `/notifications?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      set({ notifications, loading: false })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      set({ loading: false })
      throw error
    }
  },

  fetchUnreadCount: async (token) => {
    try {
      const { count } = await api.get<{ count: number }>(
        '/notifications/unread-count',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      set({ unreadCount: count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      throw error
    }
  },

  markAsRead: async (id, token) => {
    // Optimistic update
    get().optimisticMarkAsRead(id)

    try {
      await api.put(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Refresh unread count
      await get().fetchUnreadCount(token)
    } catch (error) {
      // Revert on error
      await get().fetchNotifications(token)
      throw error
    }
  },

  markAllAsRead: async (token) => {
    try {
      await api.put('/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Update all notifications to read
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      throw error
    }
  },

  markBatchAsRead: async (ids, token) => {
    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(n =>
        ids.includes(n.id) ? { ...n, read: true } : n
      )
    }))

    try {
      await api.post('/notifications/read-batch', { ids }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Refresh unread count
      await get().fetchUnreadCount(token)
    } catch (error) {
      // Revert on error
      await get().fetchNotifications(token)
      throw error
    }
  },

  deleteNotification: async (id, token) => {
    // Optimistic update
    get().optimisticDelete(id)

    try {
      await api.delete(`/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Refresh unread count
      await get().fetchUnreadCount(token)
    } catch (error) {
      // Revert on error
      await get().fetchNotifications(token)
      throw error
    }
  },

  deleteAll: async (token) => {
    try {
      await api.delete('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })

      set({ notifications: [], unreadCount: 0 })
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
      throw error
    }
  },

  deleteBatch: async (ids, token) => {
    // Optimistic update
    set(state => ({
      notifications: state.notifications.filter(n => !ids.includes(n.id))
    }))

    try {
      await api.post('/notifications/delete-batch', { ids }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Refresh unread count
      await get().fetchUnreadCount(token)
    } catch (error) {
      // Revert on error
      await get().fetchNotifications(token)
      throw error
    }
  },

  optimisticMarkAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  },

  optimisticDelete: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id)
      const wasUnread = notification && !notification.read

      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }
    })
  }
}))
