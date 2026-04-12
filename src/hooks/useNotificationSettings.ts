import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'

export interface UserNotificationSettings {
  id: string
  user_id: string
  email_enabled: boolean
  inapp_enabled: boolean
  mention_email: boolean
  mention_inapp: boolean
  reply_email: boolean
  reply_inapp: boolean
  approval_email: boolean
  approval_inapp: boolean
  system_email: boolean
  system_inapp: boolean
  frequency: 'realtime' | 'daily' | 'weekly'
  created_at: number
  updated_at: number
}

export interface UpdateNotificationSettingsInput {
  email_enabled?: boolean
  inapp_enabled?: boolean
  mention_email?: boolean
  mention_inapp?: boolean
  reply_email?: boolean
  reply_inapp?: boolean
  approval_email?: boolean
  approval_inapp?: boolean
  system_email?: boolean
  system_inapp?: boolean
  frequency?: 'realtime' | 'daily' | 'weekly'
}

export interface NotificationSettingsResponse {
  message?: string
  settings: UserNotificationSettings
}

export function useNotificationSettings() {
  const { isAuthenticated } = useAuthStore()
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  /**
   * 获取通知设置
   */
  const fetch = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setError('请先登录')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await window.fetch('http://localhost:3001/api/users/me/notification-settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '获取通知设置失败' }))
        throw new Error(errorData.error || errorData.message || '获取通知设置失败')
      }

      const data: UserNotificationSettings = await response.json()
      setSettings(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取通知设置失败'
      setError(message)
      console.error('[useNotificationSettings] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  /**
   * 更新通知设置
   */
  const update = useCallback(async (input: UpdateNotificationSettingsInput): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('请先登录')
      return false
    }

    try {
      setSaving(true)
      setError(null)

      const response = await window.fetch('http://localhost:3001/api/users/me/notification-settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '更新通知设置失败' }))
        throw new Error(errorData.error || errorData.message || '更新通知设置失败')
      }

      const data: NotificationSettingsResponse = await response.json()
      setSettings(data.settings)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新通知设置失败'
      setError(message)
      console.error('[useNotificationSettings] Update error:', err)
      return false
    } finally {
      setSaving(false)
    }
  }, [isAuthenticated])

  /**
   * 清空错误信息
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 自动加载设置（仅在登录时）
  useEffect(() => {
    if (isAuthenticated && !settings && !loading) {
      fetch()
    }
  }, [isAuthenticated, settings, loading, fetch])

  return {
    settings,
    loading,
    error,
    saving,
    fetch,
    update,
    clearError
  }
}
