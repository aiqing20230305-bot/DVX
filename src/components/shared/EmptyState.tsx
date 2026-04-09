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
  steps?: string[]
}

export function EmptyState({ icon: Icon, title, description, action, steps }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-scale">
      {/* Icon */}
      {Icon && (
        <div className="relative mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-[#3370FF]/20 rounded-full blur-xl" />
          {/* Icon container */}
          <div className="relative w-16 h-16 rounded-2xl bg-[#F7F8FA] border border-[#DEE0E3] flex items-center justify-center">
            <Icon size={32} className="text-[#8F959E]" strokeWidth={1.5} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-lg font-medium text-[#1F2329]">{title}</h3>
        {description && (
          <p className="text-sm text-[#8F959E] max-w-md">{description}</p>
        )}
      </div>

      {/* Steps */}
      {steps && steps.length > 0 && (
        <div className="mb-6 w-full max-w-sm">
          <div className="bg-[#F7F8FA]/50 border border-[#DEE0E3] rounded-xl p-4 text-left">
            <div className="text-xs font-medium text-[#646A73] mb-3">🚀 快速开始</div>
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#646A73]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#3370FF]/20 text-[#3370FF] flex items-center justify-center text-xs font-medium mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

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
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#8F959E] animate-fade-in">
      {icon}
      <span>{text}</span>
    </div>
  )
}
