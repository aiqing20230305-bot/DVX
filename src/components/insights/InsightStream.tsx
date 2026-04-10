import React from 'react'
import { Zap, ArrowRight } from 'lucide-react'
import { StreamingText } from '../shared/StreamingText.js'
import { InsightCard } from './InsightCard.js'
import { SkeletonList } from '../shared/Skeleton.js'
import { EmptyState } from '../shared/EmptyState.js'
import { Insight, AsyncStatus } from '../../types/index.js'
import { useNavigate } from 'react-router-dom'

interface InsightStreamProps {
  status: AsyncStatus
  insights: Insight[]
  selectedIds: Set<string>
  streamBuffer: string
  onToggleSelect: (id: string) => void
  initialLoading?: boolean
  onCommentClick?: (insightId: string) => void
  getCommentCount?: (targetType: string, targetId: string) => number
}

export function InsightStream({ status, insights, selectedIds, streamBuffer, onToggleSelect, initialLoading = false, onCommentClick, getCommentCount }: InsightStreamProps) {
  const navigate = useNavigate()

  // Show skeleton during initial load
  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#C9CDD4] animate-pulse" />
          <span className="text-sm text-[#8F959E]">加载已有洞察...</span>
        </div>
        <SkeletonList count={6} />
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <EmptyState
        icon={Zap}
        title="洞察引擎待命"
        description="上传电商数据文件，AI 会深度分析并挖掘内容机会"
        steps={[
          '返回数据工作台，上传数据文件（Excel/PDF）',
          '等待 AI 自动解析文件内容',
          '回到此页面，点击「生成洞察」按钮',
          'AI 实时分析数据，生成洞察卡片'
        ]}
        action={{
          label: '前往上传数据',
          onClick: () => navigate('/'),
          icon: <ArrowRight size={16} />
        }}
      />
    )
  }

  if (status === 'loading' || status === 'streaming') {
    return (
      <div className="space-y-6">
        {/* Live stream view */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#3370FF] animate-pulse" />
            <span className="text-sm text-[#646A73]">AI 正在分析数据，实时生成洞察...</span>
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
            <div className="text-sm text-[#646A73] mb-3">已生成 {insights.length} 条洞察</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {insights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  selected={selectedIds.has(insight.id)}
                  onToggleSelect={onToggleSelect}
                  onCommentClick={onCommentClick}
                  commentCount={getCommentCount?.('insight', insight.id) || 0}
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
        <p className="text-[#8F959E] text-sm">请检查网络连接和 API 配置后重试</p>
      </div>
    )
  }

  // Success
  return (
    <div className="space-y-4">
      {insights.length === 0 ? (
        <div className="text-center py-16 text-[#8F959E]">未生成任何洞察</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {insights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              selected={selectedIds.has(insight.id)}
              onToggleSelect={onToggleSelect}
              onCommentClick={onCommentClick}
              commentCount={getCommentCount?.('insight', insight.id) || 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
