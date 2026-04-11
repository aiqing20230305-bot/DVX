import React, { useState } from 'react'
import { Clock, Users, CheckSquare, Square, Star, MessageCircle, TrendingUp, AlertCircle, Info } from 'lucide-react'
import { TopicCard as TopicCardType } from '../../types/index.js'
import { PlatformBadge } from '../shared/Badge.js'

interface TopicCardProps {
  topic: TopicCardType
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onPriorityChange?: (id: string, priority: number) => void
  onCommentClick?: (topicId: string) => void
  commentCount?: number
}

const platformAccent: Record<string, string> = {
  douyin: 'border-pink-800/40 hover:border-pink-700/60',
  kuaishou: 'border-orange-800/40 hover:border-orange-700/60',
  xiaohongshu: 'border-red-800/40 hover:border-red-700/60',
}

export const TopicCard = React.memo(function TopicCard({
  topic,
  selected = false,
  onToggleSelect,
  onPriorityChange,
  onCommentClick,
  commentCount = 0
}: TopicCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const duration = topic.estimated_duration
  const durationStr = duration >= 60 ? `${Math.floor(duration / 60)}分${duration % 60 > 0 ? `${duration % 60}秒` : ''}` : `${duration}秒`

  // Priority color and label mapping
  const priorityConfig = {
    5: { label: '高优先级', color: 'var(--color-error)', icon: TrendingUp },
    4: { label: '中高优先级', color: 'var(--color-warning)', icon: AlertCircle },
    3: { label: '中优先级', color: 'var(--color-warning)', icon: AlertCircle },
    2: { label: '中低优先级', color: 'var(--color-info)', icon: Info },
    1: { label: '低优先级', color: 'var(--color-info)', icon: Info }
  }
  const priorityInfo = priorityConfig[topic.priority as keyof typeof priorityConfig] || priorityConfig[3]
  const PriorityIcon = priorityInfo.icon

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onToggleSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onToggleSelect(topic.id)
    }
  }

  return (
    <div
      className={[
        'relative border rounded-lg p-4 transition-all duration-200 focus-visible-card',
        selected ? 'shadow-md' : 'hover:shadow-sm hover:-translate-y-0.5',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      style={{
        backgroundColor: 'var(--color-bg-elevated-1)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: selected ? '0 0 0 1px var(--color-primary)' : undefined
      }}
      onClick={() => onToggleSelect?.(topic.id)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={onToggleSelect ? 0 : undefined}
      role={onToggleSelect ? 'button' : undefined}
      aria-label={onToggleSelect ? `选择选题: ${topic.title}` : undefined}
      aria-pressed={onToggleSelect ? selected : undefined}
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

      {/* Comment indicator - floating badge at top right */}
      {commentCount > 0 && onCommentClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCommentClick(topic.id)
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

      {/* Header */}
      <div className="flex flex-wrap gap-1.5 mb-3 mt-1">
        <PlatformBadge platform={topic.platform} size="md" />
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{
          backgroundColor: 'var(--color-bg-elevated-2)',
          color: 'var(--color-text-tertiary)'
        }}>
          <Clock size={11} />
          {durationStr}
        </span>
        {/* Priority badge */}
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: `${priorityInfo.color}20`,
            color: priorityInfo.color
          }}
        >
          <PriorityIcon size={11} />
          P{topic.priority}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold mb-2 leading-snug" style={{ color: 'var(--color-text-primary)' }}>{topic.title}</h3>

      {/* Angle */}
      <div className="mb-2.5">
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>切角：</span>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{topic.angle}</span>
      </div>

      {/* Persona */}
      <div className="flex items-start gap-1.5 mb-2.5">
        <Users size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{topic.persona}</span>
      </div>

      {/* CTA */}
      <div className="rounded-md px-2.5 py-1.5" style={{ backgroundColor: 'var(--color-bg-elevated-2)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>CTA：</span>
        <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>{topic.cta}</span>
      </div>
    </div>
  )
})
