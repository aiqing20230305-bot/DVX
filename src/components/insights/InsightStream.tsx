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
  focusIndex?: number
  focusedId?: string | null
}

export function InsightStream({ status, insights, selectedIds, streamBuffer, onToggleSelect, initialLoading = false, onCommentClick, getCommentCount, focusIndex = 0, focusedId = null }: InsightStreamProps) {
  const navigate = useNavigate()

  // Show skeleton during initial load
  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-border-light)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载已有洞察...</span>
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
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>AI 正在分析数据，实时生成洞察...</span>
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
            <div className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>已生成 {insights.length} 条洞察</div>
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 list-none" role="list">
              {insights.map((insight, index) => (
                <li key={insight.id} role="listitem">
                  <InsightCard
                    insight={insight}
                    selected={selectedIds.has(insight.id)}
                    focused={index === focusIndex}
                    onToggleSelect={onToggleSelect}
                    onCommentClick={onCommentClick}
                    commentCount={getCommentCount?.('insight', insight.id) || 0}
                    data-keyboard-focus={insight.id}
                  />
                </li>
              ))}
              {/* Skeleton placeholders */}
              {insights.length < 3 && <SkeletonList count={3 - insights.length} />}
            </ul>
          </div>
        )}

        {insights.length === 0 && <SkeletonList count={6} />}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16">
        <div className="text-lg font-semibold mb-2" style={{ color: 'var(--color-error)' }}>生成失败</div>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>请检查网络连接和 API 配置后重试</p>
      </div>
    )
  }

  // Success
  return (
    <div className="space-y-4">
      {insights.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-tertiary)' }}>未生成任何洞察</div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 list-none" role="listbox" aria-activedescendant={focusedId || undefined}>
          {insights.map((insight, index) => (
            <li key={insight.id} role="listitem">
              <InsightCard
                insight={insight}
                selected={selectedIds.has(insight.id)}
                focused={index === focusIndex}
                onToggleSelect={onToggleSelect}
                onCommentClick={onCommentClick}
                commentCount={getCommentCount?.('insight', insight.id) || 0}
                data-keyboard-focus={insight.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
