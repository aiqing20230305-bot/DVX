import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Copy, Check } from 'lucide-react'
import { Toast as ToastType } from '../../store/toast.store.js'
import { getErrorDetails } from '../../utils/error-message.js'

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
    bg: 'var(--color-success-bg)',
    border: 'var(--color-success)',
    icon: 'var(--color-success)',
    text: 'var(--color-text-primary)'
  },
  error: {
    bg: 'var(--color-error-bg)',
    border: 'var(--color-error)',
    icon: 'var(--color-error)',
    text: 'var(--color-text-primary)'
  },
  warning: {
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning)',
    icon: 'var(--color-warning)',
    text: 'var(--color-text-primary)'
  },
  info: {
    bg: 'var(--color-info-bg)',
    border: 'var(--color-info)',
    icon: 'var(--color-info)',
    text: 'var(--color-text-primary)'
  }
}

export function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [copied, setCopied] = useState(false)
  const Icon = iconMap[toast.type]
  const colors = colorMap[toast.type]

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 300) // Match animation duration
  }

  const handleCopy = async () => {
    try {
      const details = getErrorDetails({
        userMessage: toast.title,
        suggestions: toast.suggestions || [],
        severity: toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'info',
        technicalDetails: toast.technicalDetails
      })
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
            backgroundColor: colors.border,
            opacity: 0.3,
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

          {/* Suggestions */}
          {toast.suggestions && toast.suggestions.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {toast.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="flex-shrink-0 mt-0.5">{idx + 1}.</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Copy button */}
          {toast.canCopy && toast.technicalDetails && (
            <button
              onClick={handleCopy}
              className="mt-2 px-2 py-1 text-xs rounded flex items-center gap-1 transition-all duration-100"
              style={{
                color: 'var(--color-text-tertiary)',
                backgroundColor: 'var(--color-bg-elevated-2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
              }}
            >
              {copied ? (
                <>
                  <Check size={12} />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>复制错误详情</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg transition-all duration-100"
          style={{ color: 'var(--color-text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
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
