import React, { useState } from 'react'
import { Film, Clock, Eye, MessageSquare, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { ParsedDataVideoAnalysis, FrameAnalysis } from '../../types/index.js'

interface VideoAnalysisProps {
  data: ParsedDataVideoAnalysis
}

function ShotTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    '特写': 'bg-rose-900/30 text-rose-300 border-rose-700/40',
    '中景': 'bg-blue-900/30 text-blue-300 border-blue-700/40',
    '全景': 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40',
    '产品特写': 'bg-amber-900/30 text-amber-300 border-amber-700/40',
    '口播': 'bg-purple-900/30 text-purple-300 border-purple-700/40',
    '文字卡片': 'bg-cyan-900/30 text-cyan-300 border-cyan-700/40',
    '对比镜头': 'bg-orange-900/30 text-orange-300 border-orange-700/40',
  }

  const className = colorMap[type] || 'bg-slate-800 text-slate-300 border-slate-700'

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${className}`}>
      {type}
    </span>
  )
}

function FrameCard({ frame, index }: { frame: FrameAnalysis; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/30 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-900/40 border border-indigo-700/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-300">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Clock size={12} className="text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-400">{frame.timestamp}</span>
            <ShotTypeBadge type={frame.shotType} />
            {frame.productVisible && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-700/40">
                产品
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 truncate">{frame.scene}</p>
        </div>
        <div className="flex-shrink-0 text-slate-500">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-700/50 pt-2">
          <div>
            <div className="text-xs text-slate-500 mb-1">画面描述</div>
            <p className="text-sm text-slate-300 leading-relaxed">{frame.scene}</p>
          </div>

          {frame.textOverlay && (
            <div>
              <div className="text-xs text-slate-500 mb-1">画面文字</div>
              <p className="text-sm text-cyan-300 bg-cyan-900/20 rounded px-2 py-1">
                {frame.textOverlay}
              </p>
            </div>
          )}

          <div>
            <div className="text-xs text-slate-500 mb-1">氛围</div>
            <span className="text-sm text-slate-300">{frame.mood}</span>
          </div>

          {frame.elements.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">关键元素</div>
              <div className="flex flex-wrap gap-1">
                {frame.elements.map((el, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300"
                  >
                    {el}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function VideoAnalysis({ data }: VideoAnalysisProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Overall assessment */}
      <div className="space-y-3">
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300">视频结构评估</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{data.overallStructure}</p>
        </div>

        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-300">Hook 有效性分析</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{data.hookAnalysis}</p>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">内容要点</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{data.contentNotes}</p>
        </div>
      </div>

      {/* Frame timeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Film size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400">
            关键帧分析 ({data.frames.length} 帧)
          </span>
        </div>
        <div className="space-y-2">
          {data.frames.map((frame, i) => (
            <FrameCard key={i} frame={frame} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
