import React from 'react'
import { TrendingUp, TrendingDown, Minus, CheckSquare, Square, MessageCircle } from 'lucide-react'
import { Insight } from '../../types/index.js'
import { InsightTypeBadge, ConfidenceBadge } from '../shared/Badge.js'

interface InsightCardProps {
  insight: Insight
  selected?: boolean
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

export const InsightCard = React.memo(function InsightCard({ insight, selected = false, onToggleSelect, onCommentClick, commentCount = 0 }: InsightCardProps) {
  return (
    <div
      className={[
        'relative border rounded-lg p-4 transition-all duration-100',
        selected
          ? 'shadow-md'
          : 'hover:shadow-sm',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      style={{
        backgroundColor: 'var(--color-bg-elevated-1)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: selected ? '0 0 0 1px var(--color-primary)' : undefined
      }}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Selection checkbox */}
      {onToggleSelect && (
        <div className="absolute top-3 right-3">
          {selected
            ? <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} />
            : <Square size={16} style={{ color: 'var(--color-border-light)' }} />
          }
        </div>
      )}

      {/* Header badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <InsightTypeBadge type={insight.type} />
        <ConfidenceBadge confidence={insight.confidence} />
        {insight.actionable && (
          <span className="text-xs px-2 py-0.5 rounded-full ring-1" style={{
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            borderColor: 'var(--color-primary)'
          }}>
            可行动
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold mb-2 pr-5" style={{ color: 'var(--color-text-primary)' }}>{insight.title}</h3>

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
        <div className="space-y-1.5 mb-3">
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

      {/* Comment button */}
      {onCommentClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCommentClick(insight.id)
          }}
          className="flex items-center gap-1.5 text-xs transition-colors duration-100 mt-auto pt-2 border-t"
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
