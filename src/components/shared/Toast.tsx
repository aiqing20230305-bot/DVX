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
    bg: 'bg-emerald-900/90',
    border: 'border-emerald-700',
    icon: 'text-emerald-400',
    text: 'text-emerald-100'
  },
  error: {
    bg: 'bg-red-900/90',
    border: 'border-red-700',
    icon: 'text-red-400',
    text: 'text-red-100'
  },
  warning: {
    bg: 'bg-amber-900/90',
    border: 'border-amber-700',
    icon: 'text-amber-400',
    text: 'text-amber-100'
  },
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-700',
    icon: 'text-blue-400',
    text: 'text-blue-100'
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
        ${colors.bg} ${colors.border} border backdrop-blur-sm
        rounded-xl shadow-2xl p-4 pr-12 min-w-[320px] max-w-[480px]
        relative overflow-hidden
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
      role="alert"
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/30 animate-shrink-width"
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
          {toast.message && (
            <p className="text-sm text-slate-300 mt-1">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
