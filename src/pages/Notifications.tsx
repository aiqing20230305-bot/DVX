import React, { useEffect, useState } from 'react'
import { Bell, Check, Trash2, RotateCcw } from 'lucide-react'
import { useNotificationStore } from '../store/notification.store.js'
import { NotificationItem } from '../components/notifications/NotificationItem.js'
import { Button } from '../components/shared/Button.js'
import { toast } from '../store/toast.store.js'

export function Notifications() {
  const { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAll } = useNotificationStore()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [token, setToken] = useState<string>('')

  // Initialize token from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '')
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchUnreadCount(token)
      fetchNotifications(token, { read: filter === 'unread' ? false : undefined, limit: 100 })
    }
  }, [filter, token, fetchNotifications, fetchUnreadCount])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id, token)
    } catch (error) {
      toast.error('操作失败', error instanceof Error ? error.message : String(error))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(token)
      toast.success('已全部标记为已读')
    } catch (error) {
      toast.error('操作失败', error instanceof Error ? error.message : String(error))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id, token)
    } catch (error) {
      toast.error('删除失败', error instanceof Error ? error.message : String(error))
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('确定要删除所有通知吗？')) return

    try {
      await deleteAll(token)
      toast.success('已删除所有通知')
    } catch (error) {
      toast.error('删除失败', error instanceof Error ? error.message : String(error))
    }
  }

  const handleRefresh = () => {
    fetchNotifications(token, { read: filter === 'unread' ? false : undefined, limit: 100 })
    fetchUnreadCount(token)
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center" style={{
            backgroundColor: 'rgba(99, 91, 255, 0.2)',
            borderColor: 'rgba(99, 91, 255, 0.3)'
          }}>
            <Bell size={18} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>通知中心</h1>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 text-xs font-medium text-white rounded-full"
              style={{ backgroundColor: 'var(--color-error)' }}
            >
              {unreadCount}条未读
            </span>
          )}
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--color-text-tertiary)' }}>查看所有系统通知和审批消息</p>
      </div>

      {/* Controls */}
      <div className="mb-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setFilter('all')}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors',
                filter === 'all' ? '' : ''
              ].join(' ')}
              style={{
                backgroundColor: filter === 'all' ? 'var(--color-primary)' : 'transparent',
                color: filter === 'all' ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              全部通知
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors',
                filter === 'unread' ? '' : ''
              ].join(' ')}
              style={{
                backgroundColor: filter === 'unread' ? 'var(--color-primary)' : 'transparent',
                color: filter === 'unread' ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleRefresh}
              disabled={loading}
            >
              刷新
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              全部已读
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={handleDeleteAll}
              disabled={notifications.length === 0}
            >
              清空
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-elevated-1)' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--color-primary)' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {filter === 'unread' ? '没有未读通知' : '暂无通知'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {filter === 'unread' ? '所有通知都已阅读' : '您还没有收到任何通知'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
