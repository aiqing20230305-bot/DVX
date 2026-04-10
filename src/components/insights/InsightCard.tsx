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
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-400" />
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-[#8F959E]" />
}

export const InsightCard = React.memo(function InsightCard({ insight, selected = false, onToggleSelect, onCommentClick, commentCount = 0 }: InsightCardProps) {
  return (
    <div
      className={[
        'relative bg-[#F7F8FA] border rounded-xl p-5 transition-all duration-200 card-hover',
        selected
          ? 'border-[#3370FF]/60 bg-[#0D3DB8]/10 shadow-md shadow-[#0D3DB8]/20'
          : typeColors[insight.type] ?? 'border-[#DEE0E3]',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Selection checkbox */}
      {onToggleSelect && (
        <div className="absolute top-4 right-4">
          {selected
            ? <CheckSquare size={18} className="text-[#5B8EFF]" />
            : <Square size={18} className="text-[#C9CDD4]" />
          }
        </div>
      )}

      {/* Header badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <InsightTypeBadge type={insight.type} />
        <ConfidenceBadge confidence={insight.confidence} />
        {insight.actionable && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            可行动
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[#1F2329] mb-2 pr-6">{insight.title}</h3>

      {/* Summary */}
      <p className="text-sm text-[#646A73] leading-relaxed mb-3">{insight.summary}</p>

      {/* Metric */}
      {insight.metric && (
        <div className="flex items-center gap-2 mb-3 bg-[#F2F3F5] rounded-lg px-3 py-2">
          <TrendIcon trend={insight.metric.trend} />
          <span className="text-xs text-[#8F959E]">{insight.metric.label}</span>
          <span className="text-sm font-bold text-[#1F2329] ml-auto">{insight.metric.value}</span>
        </div>
      )}

      {/* Evidence */}
      {insight.evidence.length > 0 && (
        <div className="space-y-1.5 mb-3">
          <div className="text-xs text-[#8F959E] font-medium">支撑证据</div>
          <ul className="space-y-1">
            {insight.evidence.slice(0, 3).map((e, i) => (
              <li key={i} className="text-xs text-[#646A73] flex items-start gap-1.5">
                <span className="text-[#3370FF] mt-0.5 flex-shrink-0">•</span>
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
          className="flex items-center gap-1.5 text-xs text-[#8F959E] hover:text-[#3370FF] transition-colors mt-auto pt-2 border-t border-[#DEE0E3]"
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
