import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './Button.js'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-scale">
      {/* Icon */}
      {Icon && (
        <div className="relative mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl" />
          {/* Icon container */}
          <div className="relative w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Icon size={32} className="text-slate-500" strokeWidth={1.5} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-lg font-medium text-slate-200">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 max-w-md">{description}</p>
        )}
      </div>

      {/* Action */}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          icon={action.icon}
          className="animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Mini empty state for inline use
interface MiniEmptyStateProps {
  text: string
  icon?: React.ReactNode
}

export function MiniEmptyState({ text, icon }: MiniEmptyStateProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500 animate-fade-in">
      {icon}
      <span>{text}</span>
    </div>
  )
}
