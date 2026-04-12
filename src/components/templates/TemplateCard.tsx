import React, { useState } from 'react'
import { FileText, Eye, Play, Star } from 'lucide-react'
import { ScriptTemplate } from '../../types/index.js'
import { PlatformBadge } from '../shared/Badge.js'

interface TemplateCardProps {
  template: ScriptTemplate
  onPreview: (id: string) => void
  onApply: (id: string) => void
}

// 分类标签配置
const categoryConfig = {
  emotion: { label: '情感型', color: 'var(--color-error)' },
  rational: { label: '理性型', color: 'var(--color-info)' },
  harvest: { label: '种草型', color: 'var(--color-success)' },
  custom: { label: '自定义', color: 'var(--color-warning)' }
}

export const TemplateCard = React.memo(function TemplateCard({
  template,
  onPreview,
  onApply
}: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const categoryInfo = categoryConfig[template.category as keyof typeof categoryConfig] || categoryConfig.custom
  const isOfficial = template.project_id === null

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPreview(template.id)
  }

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation()
    onApply(template.id)
  }

  return (
    <div
      className="relative border rounded-lg p-5 transition-all duration-200 cursor-pointer hover:shadow-sm hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--color-bg-elevated-1)',
        borderColor: 'var(--color-border)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPreview(template.id)}
    >
      {/* Official Badge */}
      {isOfficial && (
        <div className="absolute top-4 right-4">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: 'var(--color-primary-bg)',
              color: 'var(--color-primary)'
            }}
          >
            <Star size={11} />
            官方
          </span>
        </div>
      )}

      {/* Header - Category and Platform badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
          style={{
            backgroundColor: `${categoryInfo.color}20`,
            color: categoryInfo.color
          }}
        >
          {categoryInfo.label}
        </span>
        <PlatformBadge platform={template.platform} size="md" showIcon gradient />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold mb-2 leading-snug pr-12" style={{ color: 'var(--color-text-primary)' }}>
        {template.name}
      </h3>

      {/* Description */}
      {template.description && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {template.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        <span className="flex items-center gap-1">
          <FileText size={12} />
          {template.segments.length}个分段
        </span>
        <span>使用 {template.usage_count} 次</span>
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: 'var(--color-bg-elevated-2)',
                color: 'var(--color-text-tertiary)'
              }}
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span
              className="inline-block px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: 'var(--color-bg-elevated-2)',
                color: 'var(--color-text-tertiary)'
              }}
            >
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Action Buttons - show on hover */}
      <div
        className="flex gap-2 transition-all duration-150"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0)' : 'translateY(4px)'
        }}
      >
        <button
          onClick={handlePreview}
          className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-elevated-2)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Eye size={14} className="inline mr-1.5" />
          预览
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white'
          }}
        >
          <Play size={14} className="inline mr-1.5" />
          使用
        </button>
      </div>
    </div>
  )
})
