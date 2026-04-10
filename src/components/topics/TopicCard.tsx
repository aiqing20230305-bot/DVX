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
        'bg-[#F7F8FA] border rounded-xl p-5 transition-all duration-200 card-hover',
        selected
          ? 'border-[#3370FF]/60 bg-[#0D3DB8]/10'
          : platformAccent[topic.platform] ?? 'border-[#DEE0E3]',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      onClick={() => onToggleSelect?.(topic.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-2">
          <PlatformBadge platform={topic.platform} />
          <span className="inline-flex items-center gap-1 text-xs text-[#8F959E]">
            <Clock size={11} />
            {durationStr}
          </span>
        </div>
        {onToggleSelect && (
          <div className="flex-shrink-0">
            {selected
              ? <CheckSquare size={17} className="text-[#5B8EFF]" />
              : <Square size={17} className="text-[#C9CDD4]" />
            }
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[#1F2329] mb-2 leading-snug">{topic.title}</h3>

      {/* Angle */}
      <div className="mb-3">
        <span className="text-xs text-[#8F959E]">切角：</span>
        <span className="text-sm text-[#646A73]">{topic.angle}</span>
      </div>

      {/* Persona */}
      <div className="flex items-start gap-1.5 mb-3">
        <Users size={13} className="text-[#8F959E] mt-0.5 flex-shrink-0" />
        <span className="text-xs text-[#8F959E]">{topic.persona}</span>
      </div>

      {/* CTA */}
      <div className="bg-[#F2F3F5] rounded-lg px-3 py-2 mb-4">
        <span className="text-xs text-[#8F959E]">CTA：</span>
        <span className="text-xs text-[#5B8EFF] font-medium">{topic.cta}</span>
      </div>

      {/* Priority stars */}
      {onPriorityChange && (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-[#8F959E] mr-1">优先级</span>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => onPriorityChange(topic.id, star)}
              className="transition-colors"
            >
              <Star
                size={14}
                className={star <= topic.priority ? 'text-amber-400 fill-amber-400' : 'text-[#C9CDD4]'}
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
          className="flex items-center gap-1.5 text-xs text-[#8F959E] hover:text-[#3370FF] transition-colors mt-2 pt-2 border-t border-[#DEE0E3]"
        >
          <MessageCircle size={14} />
          <span>评论</span>
          {commentCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#3370FF]/10 text-[#3370FF] font-medium">
              {commentCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
})
