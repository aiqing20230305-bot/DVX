import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, GitBranch, ArrowRight, Trash2, Check } from 'lucide-react'
import { Notification } from '../../store/notification.store.js'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
}

const iconMap = {
  approval_request: GitBranch,
  approval_approved: CheckCircle,
  approval_rejected: XCircle,
  approval_next_step: ArrowRight
}

const colorMap = {
  approval_request: 'var(--color-primary-light)',
  approval_approved: 'var(--color-success)',
  approval_rejected: 'var(--color-error)',
  approval_next_step: 'var(--color-info)'
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const navigate = useNavigate()

  const Icon = iconMap[notification.type]

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }

    if (notification.link) {
      navigate(notification.link)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(notification.id)
    }
  }

  return (
    <div
      className={[
        'relative group flex items-start gap-3 p-3 border-b cursor-pointer transition-colors',
        notification.read ? '' : 'bg-opacity-50'
      ].join(' ')}
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: notification.read ? 'transparent' : 'rgba(99, 91, 255, 0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(99, 91, 255, 0.05)'
      }}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
      )}

      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{
          backgroundColor: `${colorMap[notification.type]}15`,
          color: colorMap[notification.type]
        }}
      >
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-medium mb-0.5"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {notification.title}
            </h4>
            <p
              className="text-xs line-clamp-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {notification.content}
            </p>
          </div>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.read && (
              <button
                onClick={handleMarkAsRead}
                className="p-1.5 rounded hover:bg-opacity-20 transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--color-text-tertiary)'
                }}
                title="标记为已读"
              >
                <Check size={14} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-opacity-20 transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-error)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-tertiary)'
              }}
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <span
          className="text-xs mt-1 inline-block"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {formatDistanceToNow(notification.created_at, { addSuffix: true, locale: zhCN })}
        </span>
      </div>
    </div>
  )
}
