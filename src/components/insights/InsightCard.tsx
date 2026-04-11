import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, CheckSquare, Square, MessageCircle, Sparkles } from 'lucide-react'
import { Insight } from '../../types/index.js'
import { InsightTypeBadge, ConfidenceBadge } from '../shared/Badge.js'

interface InsightCardProps {
  insight: Insight
  selected?: boolean
  focused?: boolean
  onToggleSelect?: (id: string) => void
  onCommentClick?: (insightId: string) => void
  commentCount?: number
}

const typeColors: Record<string, string> = {
  trend: 'border-blue-800/40 hover:border-blue-700/60',
  competitor: 'border-purple-800/40 hover:border-purple-700/60',
  gap: 'border-emerald-800/40 hover:border-emerald-700/60',
  attribution: 'border-orange-800/40 hover:border-orange-700/60',
  anomaly: 'border-red-800/40 hover:border-red-700/60',
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'up') return <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
  if (trend === 'down') return <TrendingDown size={14} style={{ color: 'var(--color-error)' }} />
  return <Minus size={14} style={{ color: 'var(--color-text-tertiary)' }} />
}

export const InsightCard = React.memo(function InsightCard({ insight, selected = false, focused = false, onToggleSelect, onCommentClick, commentCount = 0 }: InsightCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTitleHovered, setIsTitleHovered] = useState(false)

  // Calculate confidence percentage
  const confidencePercent = insight.confidence === 'high' ? 85 : insight.confidence === 'medium' ? 60 : 35
  const confidenceColor = insight.confidence === 'high' ? 'var(--color-success)' : insight.confidence === 'medium' ? 'var(--color-warning)' : 'var(--color-error)'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onToggleSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onToggleSelect(insight.id)
    }
  }

  return (
    <div
      className={[
        'relative border rounded-lg p-4 transition-all duration-200 group focus-visible-card',
        selected
          ? 'shadow-md'
          : 'hover:shadow-sm',
        focused && 'ring-2 ring-primary ring-offset-2',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      style={{
        backgroundColor: 'var(--color-bg-elevated-1)',
        borderColor: selected ? 'var(--color-primary)' : focused ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: selected ? '0 0 0 1px var(--color-primary)' : undefined
      }}
      onClick={() => onToggleSelect?.(insight.id)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={onToggleSelect ? 0 : undefined}
      role={onToggleSelect ? 'option' : undefined}
      aria-label={onToggleSelect ? `选择洞察: ${insight.title}` : undefined}
      aria-selected={onToggleSelect ? selected : undefined}
    >
      {/* Selection checkbox - show on hover or when selected */}
      {onToggleSelect && (
        <div
          className="absolute top-3 left-3 transition-all duration-150"
          style={{
            opacity: isHovered || selected ? 1 : 0,
            transform: isHovered || selected ? 'scale(1)' : 'scale(0.8)'
          }}
        >
          {selected
            ? <CheckSquare size={18} style={{ color: 'var(--color-primary)' }} />
            : <Square size={18} style={{ color: 'var(--color-border-light)' }} />
          }
        </div>
      )}

      {/* Comment indicator - floating badge at top right (clickable if handler provided) */}
      {commentCount > 0 && onCommentClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCommentClick(insight.id)
          }}
          className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: 'var(--color-info-bg)',
            color: 'var(--color-info)',
            border: '1px solid var(--color-info-border)'
          }}
        >
          <MessageCircle size={12} />
          <span>{commentCount}</span>
        </button>
      )}
      {commentCount > 0 && !onCommentClick && (
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
          style={{
            backgroundColor: 'var(--color-info-bg)',
            color: 'var(--color-info)',
            border: '1px solid var(--color-info-border)'
          }}
        >
          <MessageCircle size={12} />
          <span>{commentCount}</span>
        </div>
      )}

      {/* Header badges */}
      <div className="flex flex-wrap gap-1.5 mb-3 mt-1">
        <InsightTypeBadge type={insight.type} />
        {/* AI Badge - always show for insights (AI generated) */}
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ring-1"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), #06B6D4)',
            color: '#FFFFFF',
            borderColor: 'transparent'
          }}
        >
          <Sparkles size={11} />
          AI生成
        </span>
        {insight.actionable && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium ring-1" style={{
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            borderColor: 'var(--color-primary)'
          }}>
            可行动
          </span>
        )}
      </div>

      {/* Title with hover color transition */}
      <h3
        className="text-base font-semibold mb-2 pr-5 transition-colors duration-200"
        style={{ color: isTitleHovered ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
        onMouseEnter={() => setIsTitleHovered(true)}
        onMouseLeave={() => setIsTitleHovered(false)}
      >
        {insight.title}
      </h3>

      {/* Confidence visualization - progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            置信度
          </span>
          <span className="text-xs font-semibold" style={{ color: confidenceColor }}>
            {confidencePercent}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-elevated-2)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${confidencePercent}%`,
              backgroundColor: confidenceColor
            }}
          />
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>{insight.summary}</p>

      {/* Metric */}
      {insight.metric && (
        <div className="flex items-center gap-2 mb-3 rounded-md px-2.5 py-1.5" style={{
          backgroundColor: 'var(--color-bg-elevated-2)'
        }}>
          <TrendIcon trend={insight.metric.trend} />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{insight.metric.label}</span>
          <span className="text-sm font-semibold ml-auto" style={{ color: 'var(--color-text-primary)' }}>{insight.metric.value}</span>
        </div>
      )}

      {/* Evidence */}
      {insight.evidence.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>支撑证据</div>
          <ul className="space-y-1">
            {insight.evidence.slice(0, 3).map((e, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }}>•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})
