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
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    text: 'text-emerald-900'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900'
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-900'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-900'
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
        ${colors.bg} ${colors.border} border shadow-lg
        rounded-xl p-4 pr-12 min-w-[320px] max-w-[480px]
        relative overflow-hidden
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
      role="alert"
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-[#3370FF]/30 animate-shrink-width"
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${colors.icon}`}>
          <Icon size={20} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${colors.text}`}>
            {toast.title}
          </h4>
          {formattedMessage && (
            <p className="text-sm text-[#646A73] mt-1">
              {formattedMessage}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-[#8F959E] hover:text-[#1F2329] hover:bg-[#F2F3F5] transition-colors"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
