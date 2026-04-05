import React from 'react'
import { TrendingUp, TrendingDown, Minus, CheckSquare, Square } from 'lucide-react'
import { Insight } from '../../types/index.js'
import { InsightTypeBadge, ConfidenceBadge } from '../shared/Badge.js'

interface InsightCardProps {
  insight: Insight
  selected?: boolean
  onToggleSelect?: (id: string) => void
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
  return <Minus size={14} className="text-slate-500" />
}

export const InsightCard = React.memo(function InsightCard({ insight, selected = false, onToggleSelect }: InsightCardProps) {
  return (
    <div
      className={[
        'relative bg-slate-800 border rounded-xl p-5 transition-all duration-200 card-hover',
        selected
          ? 'border-indigo-500/60 bg-indigo-900/10 shadow-md shadow-indigo-900/20'
          : typeColors[insight.type] ?? 'border-slate-700',
        onToggleSelect ? 'cursor-pointer' : ''
      ].join(' ')}
      onClick={() => onToggleSelect?.(insight.id)}
    >
      {/* Selection checkbox */}
      {onToggleSelect && (
        <div className="absolute top-4 right-4">
          {selected
            ? <CheckSquare size={18} className="text-indigo-400" />
            : <Square size={18} className="text-slate-600" />
          }
        </div>
      )}

      {/* Header badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <InsightTypeBadge type={insight.type} />
        <ConfidenceBadge confidence={insight.confidence} />
        {insight.actionable && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 ring-1 ring-indigo-700/50">
            可行动
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-100 mb-2 pr-6">{insight.title}</h3>

      {/* Summary */}
      <p className="text-sm text-slate-400 leading-relaxed mb-3">{insight.summary}</p>

      {/* Metric */}
      {insight.metric && (
        <div className="flex items-center gap-2 mb-3 bg-slate-900 rounded-lg px-3 py-2">
          <TrendIcon trend={insight.metric.trend} />
          <span className="text-xs text-slate-500">{insight.metric.label}</span>
          <span className="text-sm font-bold text-slate-200 ml-auto">{insight.metric.value}</span>
        </div>
      )}

      {/* Evidence */}
      {insight.evidence.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-slate-500 font-medium">支撑证据</div>
          <ul className="space-y-1">
            {insight.evidence.slice(0, 3).map((e, i) => (
              <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})
