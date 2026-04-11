import React from 'react'
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'

/**
 * AI Badge Component (v2.2.0 Phase 2)
 *
 * AI操作状态徽章，提供统一的视觉语言
 *
 * @example
 * ```tsx
 * // Streaming state
 * <AIBadge variant="streaming" label="生成中" count={5} />
 *
 * // Processing state
 * <AIBadge variant="processing" label="批量生成" count="3/10" />
 *
 * // Complete state
 * <AIBadge variant="complete" label="生成完成" />
 *
 * // Error state
 * <AIBadge variant="error" label="生成失败" />
 * ```
 */

export interface AIBadgeProps {
  /** 徽章变体 */
  variant: 'streaming' | 'processing' | 'complete' | 'error'
  /** 显示文本 */
  label?: string
  /** 计数器（数字或字符串如 "3/10"） */
  count?: number | string
  /** 自定义类名 */
  className?: string
}

export function AIBadge({ variant, label, count, className = '' }: AIBadgeProps) {
  // Icon mapping
  const icons = {
    streaming: <Zap className="w-4 h-4 animate-pulse" />,
    processing: <Loader2 className="w-4 h-4 animate-spin" />,
    complete: <CheckCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />
  }

  // Variant styles
  const variantStyles = {
    streaming: 'ai-progress-stage ai-streaming',
    processing: 'ai-progress-stage',
    complete: 'ai-progress-stage ai-complete-badge',
    error: 'ai-progress-stage'
  }

  // Custom styles for error variant
  const errorStyle = variant === 'error' ? {
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: 'var(--color-error)'
  } : undefined

  // ARIA label for accessibility
  const ariaLabels = {
    streaming: `AI正在生成${label || '内容'}${count !== undefined ? ` (${count})` : ''}`,
    processing: `AI处理中${label ? `: ${label}` : ''}${count !== undefined ? ` (${count})` : ''}`,
    complete: `AI${label || '生成完成'}`,
    error: `AI${label || '生成失败'}`
  }

  return (
    <div
      className={`${variantStyles[variant]} ${className}`}
      data-status={variant === 'complete' ? 'complete' : variant === 'streaming' || variant === 'processing' ? 'active' : undefined}
      style={errorStyle}
      role="status"
      aria-live={variant === 'streaming' || variant === 'processing' ? 'polite' : undefined}
      aria-label={ariaLabels[variant]}
    >
      {/* Icon */}
      {icons[variant]}

      {/* Label */}
      {label && (
        <span className="font-medium">
          {label}
        </span>
      )}

      {/* Count */}
      {count !== undefined && (
        <span className="ai-batch-counter ml-1">
          {typeof count === 'number' ? (
            <span className="count-number">{count}</span>
          ) : (
            <span className="text-sm">{count}</span>
          )}
        </span>
      )}
    </div>
  )
}

/**
 * AI Badge Group - 用于显示多个阶段
 *
 * @example
 * ```tsx
 * <AIBadgeGroup>
 *   <AIBadge variant="complete" label="数据解析" />
 *   <AIBadge variant="streaming" label="生成洞察" count={3} />
 *   <AIBadge variant="processing" label="待处理" />
 * </AIBadgeGroup>
 * ```
 */
export function AIBadgeGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {children}
    </div>
  )
}
