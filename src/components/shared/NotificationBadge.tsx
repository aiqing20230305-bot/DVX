import { Bell } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'

/**
 * 通知Badge组件（v2.24.0）
 * 显示未读通知数量，点击展开通知面板
 *
 * @example
 * <NotificationBadge />
 */
export function NotificationBadge() {
  const [isOpen, setIsOpen] = useState(false)
  const badgeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 使用轮询模式获取未读数量
  const { unreadCount } = useNotifications({
    polling: true,
    pollingInterval: 30000, // 30秒轮询一次
    autoLoad: true
  })

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        badgeRef.current &&
        panelRef.current &&
        !badgeRef.current.contains(event.target as Node) &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // ESC键关闭面板
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        badgeRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div className="relative">
      {/* 通知图标按钮 */}
      <button
        ref={badgeRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors"
        aria-label={`通知${unreadCount > 0 ? `，${unreadCount}条未读` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="w-5 h-5 text-[#A3A3A3] hover:text-white transition-colors" />

        {/* 未读Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#EF4444] text-white text-[10px] font-semibold rounded-full border-2 border-[#0D0D0D]"
            aria-label={`${unreadCount}条未读通知`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {isOpen && (
        <div ref={panelRef}>
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}
