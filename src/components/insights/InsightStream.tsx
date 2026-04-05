import React from 'react'
import { Zap } from 'lucide-react'
import { StreamingText } from '../shared/StreamingText.js'
import { InsightCard } from './InsightCard.js'
import { SkeletonList } from '../shared/Skeleton.js'
import { Insight, AsyncStatus } from '../../types/index.js'

interface InsightStreamProps {
  status: AsyncStatus
  insights: Insight[]
  selectedIds: Set<string>
  streamBuffer: string
  onToggleSelect: (id: string) => void
  initialLoading?: boolean
}

export function InsightStream({ status, insights, selectedIds, streamBuffer, onToggleSelect, initialLoading = false }: InsightStreamProps) {
  // Show skeleton during initial load
  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
          <span className="text-sm text-slate-500">加载已有洞察...</span>
        </div>
        <SkeletonList count={6} />
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
          <Zap size={28} className="text-slate-600" />
        </div>
        <h3 className="text-slate-400 font-medium mb-2">洞察引擎待命</h3>
        <p className="text-slate-600 text-sm">上传数据文件后，点击「生成洞察」开始 AI 分析</p>
      </div>
    )
  }

  if (status === 'loading' || status === 'streaming') {
    return (
      <div className="space-y-6">
        {/* Live stream view */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm text-slate-400">AI 正在分析数据，实时生成洞察...</span>
          </div>
          <StreamingText
            text={streamBuffer}
            isStreaming={status === 'streaming'}
            maxHeight="200px"
          />
        </div>

        {/* Cards as they arrive */}
        {insights.length > 0 && (
          <div>
            <div className="text-sm text-slate-400 mb-3">已生成 {insights.length} 条洞察</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {insights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  selected={selectedIds.has(insight.id)}
                  onToggleSelect={onToggleSelect}
                />
              ))}
              {/* Skeleton placeholders */}
              {insights.length < 3 && <SkeletonList count={3 - insights.length} />}
            </div>
          </div>
        )}

        {insights.length === 0 && <SkeletonList count={6} />}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 text-lg font-medium mb-2">生成失败</div>
        <p className="text-slate-500 text-sm">请检查网络连接和 API 配置后重试</p>
      </div>
    )
  }

  // Success
  return (
    <div className="space-y-4">
      {insights.length === 0 ? (
        <div className="text-center py-16 text-slate-500">未生成任何洞察</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {insights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              selected={selectedIds.has(insight.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
