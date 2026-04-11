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
  focusIndex?: number
  focusedId?: string | null
}

export function TopicGrid({
  topics,
  selectedIds,
  status,
  onToggleSelect,
  onPriorityChange,
  onCommentClick,
  getCommentCount,
  initialLoading = false,
  focusIndex = 0,
  focusedId = null
}: TopicGridProps) {
  // Show skeleton during initial load
  if (initialLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-border-light)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载已有选题...</span>
        </div>
        <SkeletonList count={6} />
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-xl border flex items-center justify-center mx-auto mb-4" style={{
          backgroundColor: 'var(--color-bg-elevated-1)',
          borderColor: 'var(--color-border)'
        }}>
          <FileText size={28} style={{ color: 'var(--color-border-light)' }} />
        </div>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>等待生成选题</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>选择洞察后，点击「生成选题」开始创作</p>
      </div>
    )
  }

  if (status === 'loading' || status === 'streaming') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>AI 正在基于洞察生成选题方案...</span>
        </div>
        {topics.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 list-none" role="list">
            {topics.map((t, index) => (
              <li key={t.id} role="listitem">
                <TopicCard
                  topic={t}
                  selected={selectedIds.has(t.id)}
                  focused={index === focusIndex}
                  onToggleSelect={onToggleSelect}
                  onPriorityChange={onPriorityChange}
                  onCommentClick={onCommentClick}
                  commentCount={getCommentCount ? getCommentCount('topic', t.id) : 0}
                  data-keyboard-focus={t.id}
                />
              </li>
            ))}
          </ul>
        ) : (
          <SkeletonList count={6} />
        )}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-16">
        <div className="text-lg font-semibold mb-2" style={{ color: 'var(--color-error)' }}>生成失败</div>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>请重试或检查洞察数据是否正确</p>
      </div>
    )
  }

  if (topics.length === 0) {
    return <div className="text-center py-16" style={{ color: 'var(--color-text-tertiary)' }}>未生成任何选题</div>
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 list-none" role="listbox" aria-activedescendant={focusedId || undefined}>
      {topics.map((t, index) => (
        <li key={t.id} role="listitem">
          <TopicCard
            topic={t}
            selected={selectedIds.has(t.id)}
            focused={index === focusIndex}
            onToggleSelect={onToggleSelect}
            onPriorityChange={onPriorityChange}
            onCommentClick={onCommentClick}
            commentCount={getCommentCount ? getCommentCount('topic', t.id) : 0}
            data-keyboard-focus={t.id}
          />
        </li>
      ))}
    </ul>
  )
}
