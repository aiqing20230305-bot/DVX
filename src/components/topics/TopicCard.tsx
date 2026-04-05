import React from 'react'
import { Clock, Users, CheckSquare, Square, Star } from 'lucide-react'
import { TopicCard as TopicCardType } from '../../types/index.js'
import { PlatformBadge } from '../shared/Badge.js'

interface TopicCardProps {
  topic: TopicCardType
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onPriorityChange?: (id: string, priority: number) => void
}

const platformAccent: Record<string, string> = {
  douyin: 'border-pink-800/40 hover:border-pink-700/60',
  kuaishou: 'border-orange-800/40 hover:border-orange-700/60',
  xiaohongshu: 'border-red-800/40 hover:border-red-700/60',
}

export const TopicCard = React.memo(function TopicCard({ topic, selected = false, onToggleSelect, onPriorityChange }: TopicCardProps) {
  const duration = topic.estimated_duration
  const durationStr = duration >= 60 ? `${Math.floor(duration / 60)}分${duration % 60 > 0 ? `${duration % 60}秒` : ''}` : `${duration}秒`

  return (
    <div
      className={[
        'bg-slate-800 border rounded-xl p-5 transition-all duration-200 card-hover',
        selected
          ? 'border-indigo-500/60 bg-indigo-900/10'
          : platformAccent[topic.platform] ?? 'border-slate-700',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      onClick={() => onToggleSelect?.(topic.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-2">
          <PlatformBadge platform={topic.platform} />
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Clock size={11} />
            {durationStr}
          </span>
        </div>
        {onToggleSelect && (
          <div className="flex-shrink-0">
            {selected
              ? <CheckSquare size={17} className="text-indigo-400" />
              : <Square size={17} className="text-slate-600" />
            }
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-100 mb-2 leading-snug">{topic.title}</h3>

      {/* Angle */}
      <div className="mb-3">
        <span className="text-xs text-slate-500">切角：</span>
        <span className="text-sm text-slate-400">{topic.angle}</span>
      </div>

      {/* Persona */}
      <div className="flex items-start gap-1.5 mb-3">
        <Users size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
        <span className="text-xs text-slate-500">{topic.persona}</span>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 rounded-lg px-3 py-2 mb-4">
        <span className="text-xs text-slate-500">CTA：</span>
        <span className="text-xs text-indigo-300 font-medium">{topic.cta}</span>
      </div>

      {/* Priority stars */}
      {onPriorityChange && (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-slate-500 mr-1">优先级</span>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => onPriorityChange(topic.id, star)}
              className="transition-colors"
            >
              <Star
                size={14}
                className={star <= topic.priority ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
