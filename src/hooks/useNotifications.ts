import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth.store'

/**
 * 通知数据接口（v2.24.0）
 */
export interface Notification {
  id: string
  user_id: string
  type: 'approval_request' | 'approval_approved' | 'approval_rejected' | 'approval_next_step' | 'mention' | 'reply'
  title?: string
  content: string
  link?: string
  target_type?: 'insight' | 'topic' | 'script' | 'report'
  target_id?: string
  comment_id?: string
  author_id?: string
  is_read: boolean
  created_at: number
  sender?: {
    id: string
    email: string
    name: string
  }
}

interface NotificationsResponse {
  notifications: Notification[]
  total: number
}

interface UseNotificationsOptions {
  polling?: boolean
  pollingInterval?: number // 轮询间隔（毫秒），默认30秒
  autoLoad?: boolean // 是否自动加载
}

/**
 * 通知管理Hook（v2.24.0）
 *
 * @example
 * const {
 *   notifications,
 *   unreadCount,
 *   loading,
 *   markAsRead,
 *   markAllAsRead,
 *   refresh
 * } = useNotifications({ polling: true })
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    polling = false,
    pollingInterval = 30000, // 30秒
    autoLoad = true
  } = options

  const { isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://localhost:3001/api/notifications?limit=50', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取通知列表失败')
      }

      const data: NotificationsResponse = await response.json()
      setNotifications(data.notifications)
    } catch (err) {
      console.error('[useNotifications] Failed to fetch notifications:', err)
      setError(err instanceof Error ? err.message : '获取通知失败')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // 获取未读数量
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取未读数量失败')
      }

      const data = await response.json()
      setUnreadCount(data.count)
    } catch (err) {
      console.error('[useNotifications] Failed to fetch unread count:', err)
    }
  }, [isAuthenticated])

  // 标记单个通知为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) return

    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('标记已读失败')
      }

      // 更新本地状态
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('[useNotifications] Failed to mark as read:', err)
      throw err
    }
  }, [isAuthenticated])

  // 标记全部为已读
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('标记全部已读失败')
      }

      // 更新本地状态
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('[useNotifications] Failed to mark all as read:', err)
      throw err
    }
  }, [isAuthenticated])

  // 删除通知
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) return

    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('删除通知失败')
      }

      // 更新本地状态
      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('[useNotifications] Failed to delete notification:', err)
      throw err
    }
  }, [isAuthenticated, notifications])

  // 刷新数据
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount()
    ])
  }, [fetchNotifications, fetchUnreadCount])

  // 初始加载
  useEffect(() => {
    if (autoLoad && isAuthenticated) {
      refresh()
    }
  }, [autoLoad, isAuthenticated, refresh])

  // 轮询
  useEffect(() => {
    if (!polling || !isAuthenticated) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [polling, isAuthenticated, pollingInterval, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  }
}
