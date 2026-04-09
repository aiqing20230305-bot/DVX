import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { Toast as ToastType } from '../../store/toast.store.js'

interface ToastProps {
  toast: ToastType
  onClose: () => void
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const colorMap = {
  success: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: '#10B981',
    icon: '#10B981',
    text: '#FFFFFF'
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#EF4444',
    icon: '#EF4444',
    text: '#FFFFFF'
  },
  warning: {
    bg: 'rgba(251, 191, 36, 0.15)',
    border: '#FBBF24',
    icon: '#FBBF24',
    text: '#FFFFFF'
  },
  info: {
    bg: 'rgba(52, 152, 219, 0.15)',
    border: '#3498DB',
    icon: '#3498DB',
    text: '#FFFFFF'
  }
}

export function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const Icon = iconMap[toast.type]
  const colors = colorMap[toast.type]

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 300) // Match animation duration
  }

  // Smart message formatting
  const formatMessage = (msg: any): string => {
    if (!msg) return ''
    if (typeof msg === 'string') return msg

    // If it's an object with a message field, extract it
    if (typeof msg === 'object' && msg.message) {
      return msg.message
    }

    // If it's an error object with statusCode, format nicely
    if (typeof msg === 'object' && msg.statusCode) {
      return `${msg.message || '请求失败'} (${msg.statusCode})`
    }

    // Fallback to JSON.stringify for other objects
    try {
      return JSON.stringify(msg)
    } catch {
      return String(msg)
    }
  }

  const formattedMessage = formatMessage(toast.message)

  // Auto close on mount if duration is set
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  return (
    <div
      className={`
        border shadow-lg
        rounded-xl p-4 pr-12 min-w-[320px] max-w-[480px]
        relative overflow-hidden
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border
      }}
      role="alert"
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 animate-shrink-width"
          style={{
            backgroundColor: 'rgba(99, 91, 255, 0.3)',
            animationDuration: `${toast.duration}ms`
          }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0" style={{ color: colors.icon }}>
          <Icon size={20} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium" style={{ color: colors.text }}>
            {toast.title}
          </h4>
          {formattedMessage && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {formattedMessage}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
