import React, { useEffect, useState, useRef } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { useNotificationStore } from '../../store/notification.store.js'
import { NotificationItem } from './NotificationItem.js'
import { Button } from '../shared/Button.js'
import { toast } from '../../store/toast.store.js'

interface NotificationCenterProps {
  token: string
}

export function NotificationCenter({ token }: NotificationCenterProps) {
  const { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAll } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    if (token) {
      fetchUnreadCount(token)

      const interval = setInterval(() => {
        fetchUnreadCount(token)
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [token, fetchUnreadCount])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open && token) {
      fetchNotifications(token, { read: filter === 'unread' ? false : undefined, limit: 50 })
    }
  }, [open, filter, token, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

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

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-text-primary)'
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)'
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        title={`通知 ${unreadCount > 0 ? `(${unreadCount}条未读)` : ''}`}
      >
        <Bell size={18} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white rounded-full"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-96 rounded-lg border shadow-xl z-50 animate-fade-in-down"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              通知中心
              {unreadCount > 0 && (
                <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {unreadCount}条未读
                </span>
              )}
            </h3>

            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-opacity-10 transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setFilter('all')}
              className={[
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                filter === 'all' ? 'border-b-2' : ''
              ].join(' ')}
              style={{
                color: filter === 'all' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                borderColor: filter === 'all' ? 'var(--color-primary)' : 'transparent'
              }}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={[
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                filter === 'unread' ? 'border-b-2' : ''
              ].join(' ')}
              style={{
                color: filter === 'unread' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                borderColor: filter === 'unread' ? 'var(--color-primary)' : 'transparent'
              }}
            >
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Actions */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <Button
                variant="ghost"
                size="xs"
                icon={<Check size={12} />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                全部已读
              </Button>
              <Button
                variant="ghost"
                size="xs"
                icon={<Trash2 size={12} />}
                onClick={handleDeleteAll}
              >
                清空
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--color-text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {filter === 'unread' ? '没有未读通知' : '暂无通知'}
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

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
              <a
                href="/notifications"
                className="text-xs transition-colors"
                style={{ color: 'var(--color-primary-light)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary-light)'
                }}
                onClick={() => setOpen(false)}
              >
                查看全部通知 →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
