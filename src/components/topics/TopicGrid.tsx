import React from 'react'
import { FileText } from 'lucide-react'
import { TopicCard } from './TopicCard.js'
import { TopicCard as TopicCardType } from '../../types/index.js'
import { SkeletonList } from '../shared/Skeleton.js'
import { AsyncStatus } from '../../types/index.js'

interface TopicGridProps {
  topics: TopicCardType[]
  selectedIds: Set<string>
  status: AsyncStatus
  onToggleSelect: (id: string) => void
  onPriorityChange: (id: string, priority: number) => void
  onCommentClick?: (topicId: string) => void
  getCommentCount?: (targetType: string, targetId: string) => number
  initialLoading?: boolean
}

export function TopicGrid({
  topics,
  selectedIds,
  status,
  onToggleSelect,
  onPriorityChange,
  onCommentClick,
  getCommentCount,
  initialLoading = false
}: TopicGridProps) {
  // Show skeleton during initial load
  if (initialLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-[#C9CDD4] animate-pulse" />
          <span className="text-sm text-[#8F959E]">加载已有选题...</span>
        </div>
        <SkeletonList count={6} />
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[#F7F8FA] border border-[#DEE0E3] flex items-center justify-center mx-auto mb-4">
          <FileText size={28} className="text-[#C9CDD4]" />
        </div>
        <h3 className="text-[#646A73] font-medium mb-2">等待生成选题</h3>
        <p className="text-[#C9CDD4] text-sm">选择洞察后，点击「生成选题」开始创作</p>
      </div>
    )
  }

  if (status === 'loading' || status === 'streaming') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-[#3370FF] animate-pulse" />
          <span className="text-sm text-[#646A73]">AI 正在基于洞察生成选题方案...</span>
        </div>
        {topics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {topics.map(t => (
              <TopicCard
                key={t.id}
                topic={t}
                selected={selectedIds.has(t.id)}
                onToggleSelect={onToggleSelect}
                onPriorityChange={onPriorityChange}
                onCommentClick={onCommentClick}
                commentCount={getCommentCount ? getCommentCount('topic', t.id) : 0}
              />
            ))}
          </div>
        ) : (
          <SkeletonList count={6} />
        )}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 text-lg font-medium mb-2">生成失败</div>
        <p className="text-[#8F959E] text-sm">请重试或检查洞察数据是否正确</p>
      </div>
    )
  }

  if (topics.length === 0) {
    return <div className="text-center py-16 text-[#8F959E]">未生成任何选题</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {topics.map(t => (
        <TopicCard
          key={t.id}
          topic={t}
          selected={selectedIds.has(t.id)}
          onToggleSelect={onToggleSelect}
          onPriorityChange={onPriorityChange}
          onCommentClick={onCommentClick}
          commentCount={getCommentCount ? getCommentCount('topic', t.id) : 0}
        />
      ))}
    </div>
  )
}
