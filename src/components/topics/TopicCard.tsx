import React from 'react'
import { Clock, Users, CheckSquare, Square, Star, MessageCircle } from 'lucide-react'
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
  const duration = topic.estimated_duration
  const durationStr = duration >= 60 ? `${Math.floor(duration / 60)}分${duration % 60 > 0 ? `${duration % 60}秒` : ''}` : `${duration}秒`

  return (
    <div
      className={[
        'border rounded-lg p-4 transition-all duration-100',
        selected ? 'shadow-md' : 'hover:shadow-sm',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      style={{
        backgroundColor: 'var(--color-bg-elevated-1)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: selected ? '0 0 0 1px var(--color-primary)' : undefined
      }}
      onClick={() => onToggleSelect?.(topic.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <PlatformBadge platform={topic.platform} />
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <Clock size={11} />
            {durationStr}
          </span>
        </div>
        {onToggleSelect && (
          <div className="flex-shrink-0">
            {selected
              ? <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} />
              : <Square size={16} style={{ color: 'var(--color-border-light)' }} />
            }
          </div>
        )}
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
      <div className="rounded-md px-2.5 py-1.5 mb-3" style={{ backgroundColor: 'var(--color-bg-elevated-2)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>CTA：</span>
        <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>{topic.cta}</span>
      </div>

      {/* Priority stars */}
      {onPriorityChange && (
        <div className="flex items-center gap-1 mb-2" onClick={e => e.stopPropagation()}>
          <span className="text-xs mr-1" style={{ color: 'var(--color-text-tertiary)' }}>优先级</span>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => onPriorityChange(topic.id, star)}
              className="transition-colors duration-100"
            >
              <Star
                size={14}
                className={star <= topic.priority ? 'fill-amber-400' : ''}
                style={{ color: star <= topic.priority ? 'var(--color-warning)' : 'var(--color-border-light)' }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Comment button */}
      {onCommentClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCommentClick(topic.id)
          }}
          className="flex items-center gap-1.5 text-xs transition-colors duration-100 pt-2 border-t"
          style={{
            color: 'var(--color-text-tertiary)',
            borderColor: 'var(--color-border)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-tertiary)'
          }}
        >
          <MessageCircle size={14} />
          <span>评论</span>
          {commentCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full font-medium" style={{
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)'
            }}>
              {commentCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
})
