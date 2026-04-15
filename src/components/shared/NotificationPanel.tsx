import { CheckCheck, Trash2, X } from 'lucide-react'
import { useNotifications, type Notification } from '../../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from '../../store/toast.store'

interface NotificationPanelProps {
  onClose: () => void
}

/**
 * 通知面板组件（v2.24.0）
 * 显示通知列表，支持标记已读、删除、跳转
 *
 * @example
 * <NotificationPanel onClose={() => setIsOpen(false)} />
 */
export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications({
    autoLoad: true,
    polling: false
  })

  // 格式化相对时间
  const formatRelativeTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: zhCN
      })
    } catch {
      return '刚刚'
    }
  }

  // 点击通知
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 标记为已读
      if (!notification.is_read) {
        await markAsRead(notification.id)
      }

      // 跳转到目标页面
      if (notification.link) {
        navigate(notification.link)
      } else if (notification.target_type && notification.target_id) {
        // 根据target_type构造路由
        const routeMap: Record<string, string> = {
          insight: '/insights',
          topic: '/topics',
          script: '/scripts',
          report: '/report'
        }
        const basePath = routeMap[notification.target_type]
        if (basePath) {
          navigate(`${basePath}?highlight=${notification.target_id}`)
        }
      }

      onClose()
    } catch (error) {
      console.error('Failed to handle notification click:', error)
      toast.error('操作失败')
    }
  }

  // 标记单个为已读
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await markAsRead(notificationId)
      toast.success('已标记为已读')
    } catch {
      toast.error('标记失败')
    }
  }

  // 标记全部为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('已全部标记为已读')
    } catch {
      toast.error('操作失败')
    }
  }

  // 删除通知
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)
      toast.success('已删除')
    } catch {
      toast.error('删除失败')
    }
  }

  // 获取通知类型标签
  const getNotificationTypeLabel = (type: Notification['type']) => {
    const labelMap: Record<Notification['type'], string> = {
      mention: '@提及',
      reply: '回复',
      approval_request: '审批请求',
      approval_approved: '审批通过',
      approval_rejected: '审批拒绝',
      approval_next_step: '下一步审批'
    }
    return labelMap[type] || '通知'
  }

  return (
    <div
      className="absolute top-12 right-0 w-[400px] max-h-[600px] bg-[#1A1A1A] border border-[#333333] rounded-lg shadow-2xl overflow-hidden z-50"
      role="dialog"
      aria-label="通知面板"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333]">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">通知</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-[#EF4444] text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* 全部已读 */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-1.5 rounded hover:bg-[#2A2A2A] transition-colors group"
              title="全部标记为已读"
              aria-label="全部标记为已读"
            >
              <CheckCheck className="w-4 h-4 text-[#A3A3A3] group-hover:text-white transition-colors" />
            </button>
          )}

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#2A2A2A] transition-colors group"
            aria-label="关闭"
          >
            <X className="w-4 h-4 text-[#A3A3A3] group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="overflow-y-auto max-h-[520px] custom-scrollbar">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5E6AD2] border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-16 h-16 mb-3 rounded-full bg-[#1F1F1F] flex items-center justify-center">
              <CheckCheck className="w-8 h-8 text-[#666666]" />
            </div>
            <p className="text-sm text-[#A3A3A3]">暂无通知</p>
            <p className="text-xs text-[#666666] mt-1">所有通知已读完毕</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A2A]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors group
                  ${notification.is_read ? 'hover:bg-[#1F1F1F]' : 'bg-[#1F1F1F] hover:bg-[#252525]'}
                `}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNotificationClick(notification)
                  }
                }}
              >
                {/* 通知头部 */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* 未读标记 */}
                    {!notification.is_read && (
                      <span className="flex-shrink-0 w-2 h-2 bg-[#5E6AD2] rounded-full" aria-label="未读" />
                    )}

                    {/* 通知类型 */}
                    <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-[#2A2A2A] text-[#A3A3A3] rounded">
                      {getNotificationTypeLabel(notification.type)}
                    </span>

                    {/* 相对时间 */}
                    <span className="text-xs text-[#666666] truncate">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        className="p-1 rounded hover:bg-[#2A2A2A] transition-colors"
                        title="标记为已读"
                        aria-label="标记为已读"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-[#A3A3A3] hover:text-white transition-colors" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="p-1 rounded hover:bg-[#2A2A2A] transition-colors"
                      title="删除"
                      aria-label="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#A3A3A3] hover:text-[#EF4444] transition-colors" />
                    </button>
                  </div>
                </div>

                {/* 通知内容 */}
                <div className="space-y-1">
                  {/* 标题（审批通知有） */}
                  {notification.title && (
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {notification.title}
                    </p>
                  )}

                  {/* 内容 */}
                  <p className={`text-sm line-clamp-2 ${notification.is_read ? 'text-[#A3A3A3]' : 'text-[#CCCCCC]'}`}>
                    {notification.content}
                  </p>

                  {/* 发送者（评论通知有） */}
                  {notification.sender && (
                    <p className="text-xs text-[#666666]">
                      来自: {notification.sender.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-[#333333] bg-[#151515]">
          <button
            onClick={refresh}
            className="w-full py-2 text-sm text-[#A3A3A3] hover:text-white transition-colors"
          >
            刷新通知
          </button>
        </div>
      )}
    </div>
  )
}
